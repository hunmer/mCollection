// ==UserScript==
// @name    eagle&billfish导入
// @version    1.0
// @author    hunmer
// @description    指定素材库位置直接导入，无需导出资源包
// @namespace    6aabbcd5-b8ce-4182-b0fe-2054bee005d3

// ==/UserScript==

({
    init() {
        const self = this
        Object.assign(g_db.db_menu, {
            openEagle: {
                title: '导入eagle素材库',
                action: 'db_openEagle',
            },
            openBillfish: {
                title: '导入Billfish素材库',
                action: 'db_openBillfish',
            },

        })

        g_action.registerAction({
            db_openBillfish: () => {
                openFileDiaglog({
                    title: '打开Billfish素材库',
                    properties: ['openDirectory'],
                }, path => {
                    path.length && this.db_importFromBillfish(path[0])
                })
            },
            db_openEagle: () => {
                openFileDiaglog({
                    title: '打开eagle素材库',
                    properties: ['openDirectory'],
                }, path => {
                    path.length && this.db_importFromEagle(path[0])
                })
            }
        })
    },
    db_importFromBillfish(path) {
        let { exists } = nodejs.files

        let bf = path + '.bf\\'
        if (!exists(bf)) return toast('此目录不是billfish数据目录!', 'danger')

        // 缓存问题怎么解决？？？
        let db = this.db_read({
            file: bf + 'billfish.db',
            readonly: true,
            type: DB_TYPE_IMPORT,
        })

        g_pp.set('db_imported', async () => {
            // 加载完成回调
            let info = await db.prepare('select * from library').get()
            if (info.version < 30) return toast('仅支持billfish-V3数据库...', 'danger')

            const getColor = _i => ['', '#a3a3a3', '#f47272', '#f2b054', '#f3d919', '#90e968', '#5de0ce', '#62b7ff', '#ac5ce5', '#d571a3'][_i]

            let folders = await db.prepare('select * from bf_folder;').all()
            // SELECT * FROM sqlite_master WHERE type='table'
            let tags = await db.prepare('select * from bf_tag_v2;').all()

            const findById = (type, id) => (type == 'folder' ? folders : tags).find(_item => _item.id == id)
            const getParents = (type, id, cb) => {
                let pid = id
                let list = []

                let next = () => {
                    let obj = findById(type, pid)
                    if (obj) {
                        pid = obj.pid
                        if (pid > 0) {
                            list.unshift(pid)
                            return next()
                        }
                    }
                    cb(list)
                }
                next()
            }

            const getFolderID = (type, id) => {
                return (type == 'folder' ? folders_id : tags_id)['_' + id] || ''
            }

            //添加目录并返回目录ID
            const addFolder = (type, id) => {
                let inst = type == 'folder' ? g_folder : g_tags
                let item = findById(type, id)
                if (item) {
                    let { name, pid, born, desc, color } = item
                    let fid = getFolderID(type, pid)
                    if (fid == '') { // 新插入
                        fid = inst.folder_add({
                            desc,
                            ctime: born * 1000,
                            title: name,
                            parent: pid ? addFolder(type, pid) : '',
                            meta: {
                                color: getColor(color)
                            },
                        })
                    }
                    return fid
                }
            }

            g_tags.list = {}
            g_folder.list = {}
            let tags_id = {},
                folders_id = {}
            folders.forEach(item => {
                if (!item.is_recycle) folders_id['_' + item.id] = addFolder('folder', item.id)
            })
            tags.forEach(item => tags_id['_' + item.id] = addFolder('tag', item.id))

            console.log(folders_id, tags_id)
            let files = await db.prepare('select * from bf_file;').all()
            let metas = {
                detail: await db.prepare('select * from bf_material_userdata;').all(),
                image: await db.prepare('select * from bf_material_v2;').all(),
                video: await db.prepare('select * from bf_material_video;').all(),
                audio: await db.prepare('select * from bf_material_video;').all(),
            }
            const findMetadata = (type, id) => metas[type].find(item => item.file_id == id) || {}

            files.forEach(item => {
                let { id, name, pid, file_size, ctime, mtime, md5, tid, born, is_link } = item
                if (pid != -1) { // 排除回收站
                    // 获取多层文件夹结构
                    getParents('folder', 16, parents_id => {
                        try {
                            let file = path + parents_id.map(_pid => findById('folder', _pid).name).join('\\') + '\\' + name
                            if (is_link /* || getExtName(file).toLowerCase() == 'lnk'*/ ) {
                                // 获取文件真实路径
                                file = nodejs.shell.readShortcutLink(file).target
                            }

                            let json = {}
                            let { note, origin, score } = findMetadata('detail', id)
                            let { w, h, colors } = findMetadata('image', id)
                            json.width = w
                            json.height = h

                            let file_type = g_format.getFileType(name)
                            if (file_type == 'audio') {
                                let { duration, bit_rate } = findMetadata('audio', id)
                                data.duration = duration
                                data.bit_rate = bit_rate
                            } else
                            if (file_type == 'video') {
                                let { duration, ratotion } = findMetadata('video', id)
                                data.duration = duration
                                data.ratotion = ratotion
                            }

                            // billfish 颜色的格式是什么？？
                            // if(typeof(colors) == 'string') colors.split('|').map(color => color.split(',')[1])
                            let data = {
                                file: name,
                                md5,
                                score,
                                desc: note,
                                link: origin,
                                folders: getFolderID('folder', pid),
                                tags: getFolderID('tags', pid),
                                birthtime: born,
                                size: file_size,
                                json,
                            }
                            console.log(data)
                        } catch (err) {
                            console.error('读取lnk失败', err)
                        }
                    })
                }
            })
        }, { once: true })

        if (!db) return toast('加载数据库失败!', 'danger')
    },

    db_importFromEagle(path) {
        let r = {}
        let meta = path + '\\metadata.json'
        if (!nodejs.files.exists(meta)) return toast('此目录不是eagle数据目录!', 'danger')

        let dirs = nodejs.files.listDir(path + '\\images')
        if (!dirs.length) return toast('没有找到任何素材', 'danger')

        meta = JSON.parse(nodejs.files.read(meta))

        // 获取所有目录
        let folders = {}
        let addFolder = (item, par) => {
            let d = {
                title: item.name,
                desc: item.desc || '',
                parent: par || '', // todo 实时添加目录
                icon: item.icon || 'folder',
                color: item.iconColor || '',
            }
            g_cache.folderPreset[item.id] = d // 临时保存，如果数据导入有这个id就用这个数据创建

            folders[item.id] = d
            item.children.forEach(child => addFolder(child, item.id))
        }
        meta.folders.forEach(item => addFolder(item))

        // 进度条显示
        let cancel = false
        let progress = new Progress('import', {
            datas: dirs,
            autoClose: false,
            logText: '<p><b class="text-success">√ 成功解析:</b>\n<b>%%s%%</b></p>',
            onProgress: i => {
                if (i >= 100) {
                    let btn = g_modal.modal_get('progress_import').find('#btn_ok').html('开始导入') // TODO 导入选项?
                    if ($('#checkbox_import_auto').prop('checked')) btn[0].click()
                }
            },
            onClose: function() {
                g_modal.remove('progress_import')
            }
        }).build(html => {
            alert(html, {
                id: 'progress_import',
                title: '解析eagle素材中...',
                btn_ok: '取消',
                footer: `
                     <label class="form-check me-2">
                        <input id="checkbox_import_auto" type="checkbox" class="form-check-input"/>
                        <span class="form-check-label">自动导入</span>
                     </label>
                    {btn}
                `,
                scrollable: true,
            }).then(() => {
                progress.destroy()
                if (progress.val >= 100) {
                    // TODO 显示导入选项和素材库选择
                    // TODO 素材库选择器
                    g_data.data_import(r)
                } else {
                    cancel = true // 取消
                }
            })
        })

        let i = 0
        const next = () => {
            let dir = dirs[i++]
            if (cancel || dir == undefined) return
            let json = dir + '\\metadata.json'
            if (nodejs.files.exists(json)) {
                try {
                    json = JSON.parse(nodejs.files.read(json))
                    if (!json.isDeleted) {
                        let data = {
                            width: json.width,
                            height: json.height,
                        }

                        if (json.palettes) data.colors = json.palettes.map(v => v.color)
                        if (json.duration) data.duration = json.duration
                        if (json.comments) data.comments = (json.comments || []).map(v => {
                            return {
                                time: v.duration,
                                text: v.annotation,
                                date: v.lastModified
                            }
                        })

                        let file = dir + '\\' + json.name + '.' + json.ext
                        let md5 = nodejs.files.getFileMd5(file)
                        // todo 重复md5检测
                        // md5 = json.id
                        r[md5] = {
                            folders: json.folders,
                            file,
                            tags: json.tags,
                            link: json.url,
                            md5,
                            title: json.name,
                            desc: json.annotation,
                            birthtime: json.btime,
                            size: json.size,
                            score: json.star || 0,
                            json: data,
                        }
                    }
                } catch (e) {


                }
            }
            progress.setSloved(dir)
            setTimeout(() => next(), 25)
        }
        next()
    },
}).init()
