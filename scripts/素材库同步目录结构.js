// ==UserScript==
// @name    素材库同步目录结构
// @version    0.0.1
// @author    hunmer
// @description    实现类似billfish素材结构
// @updateURL   https://neysummer2000.fun/mCollection/scripts/素材库同步目录结构.js
// @primary    90
// @namespace    3fd15c01-bb85-4b7c-8579-eba1d87dc965

// ==/UserScript==
const _getFolersPath = (folder, join = '/') => [...g_folders.folder_getParents(folder), folder].map(fid => g_folders.folder_getValue(fid, 'title')).join(join);

(() => {
    // TODO 转化储存结构函数
    g_action.registerAction({
        async __() {
            let filPath = g_db.opts.path + '/files/'
            let targetPath = 'G:/影视.library/'
            let md5_list = await g_data.all('SELECT id,md5,title FROM files')
            let fid_list = await g_data.all('SELECT * FROM folders_meta')
            let max = md5_list.length
            md5_list.forEach(async ({ id, md5, title }, i) => {
                let saveTo = ''
                let folder = fid_list.find(({ fid }) => fid == id)
                if (folder) saveTo += _getFolersPath(g_data.arr_split(folder.ids)[0]) + '/'

                let file = await g_db.getSaveTo(md5) + title
                let newFile = targetPath + 'files/' + saveTo + title
                if (!nodejs.files.exists(newFile)) {
                    try {
                        nodejs.files.copySync(file, newFile)
                    } catch (err) {
                        console.error(err)
                    }
                }

                let cover = await g_db.getSaveTo(md5) + 'cover.jpg'
                let newCover = targetPath + 'covers/' + saveTo + getFileName(title, false) + '.jpg'
                if (!nodejs.files.exists(newCover)) {
                    try {
                        nodejs.files.copySync(cover, newCover)
                    } catch (err) {
                        console.error(err)
                    }
                }
                console.log({ progress: (i / max * 100).toFixed(2), title })

            })

        }
    })

    // 遍历目录，创建不存在的文件夹
    g_plugin.registerEvent('db_connected', () => {
        g_folders.entries((i, item) => {
            let path = g_db.opts.path + '/folders/' + _getFolersPath(item.id)
            if (!nodejs.files.exists(path)) nodejs.files.mkdir(path)
        })
    })

    // 文件夹数据变动前
    g_plugin.registerEvent('db_beforeInsert', async ({ data, table, meta }) => {
        if (table == 'folders_meta') {
            data.ids = g_data.arr_join(g_data.arr_split(data.ids).slice(0, 1)) // 只允许保存一个目录
            // 记录旧文件
            meta.oldFile = await g_item.item_getVal('file', meta.data = await g_data.data_getDataByID(data.fid))
        }
    })

    // 素材文件夹改动事件
    g_plugin.registerEvent('db_afterInsert', async ({ opts, ret, method }) => {
        if (opts.table == 'folders_meta' && method == 'update') {
            let { oldFile, data } = opts.meta
            if (oldFile != undefined) {
                let newFile = await g_item.item_getVal('file', data)
                if (oldFile != newFile) { // 目录发生改变
                    nodejs.files.move(oldFile, newFile)
                }
            }
        }
    })

    // 更改封面路径
    g_item.setItemType('cover', {
        initFile: args => {
            let { md5, title } = args.data
            let path = g_db.opts.path + '/cover/'

            if (getFileType(title) == 'audio') {
                if (!getConfig('showAlbumCover') || !nodejs.files.exists(path + md5 + '.jpg')) {
                    args.cover = path + md5 + '.png' // 波形图
                    return
                }
            }
            args.cover = path + md5 + '.jpg'
        }
    })

    // 更改文件路径
    g_db.getSaveTo = async function (md5, path) { // TODO传入对象包含id
        path ??= this.opts.path
        path += '/folders/'
        if (!isEmpty(md5)) {
            let id = await g_data.data_getID(md5)
            // 可能是导入文件前的调用
            folders = g_data.file_cache[md5]?.meta?.folders
            if (Array.isArray(folders)) {
                path += folders[0]
            } else {
                let folder = (await g_detail.inst.folders.get(id))[0]
                if (folder != undefined) path += _getFolersPath(folder)
            }
        }
        if (!path.endsWith('/')) path += '/'
        return path
    }
})()

