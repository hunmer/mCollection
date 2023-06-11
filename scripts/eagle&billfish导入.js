// ==UserScript==
// @name    eagle&billfish导入
// @version    1.0
// @author    hunmer
// @description    指定素材库位置直接导入，无需导出资源包
// @updateURL   https://neysummer2000.fun/mCollection/scripts/eagle&billfish导入.txt
// @namespace    6aabbcd5-b8ce-4182-b0fe-2054bee005d3

// ==/UserScript==

({
    init() {
        const self = this
        Object.assign(g_db.db_menu, {
            openEagle: {
                title: '导入Eagle素材库',
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

        // _test(() => setTimeout(() => this.db_importFromBillfish('D:/billfish_librarys/test'), 1000)) // 等待标签加载完成
        // _test(() => setTimeout(() => this.db_importFromEagle('I:/software/eagleData/tt.library'), 2000)) // 等待标签加载完成

    },
    async db_importFromBillfish(path) {
        let { exists } = nodejs.files
        let bf = path + '/.bf/'
        if (!exists(bf)) return toast('此目录不是billfish数据目录!', 'danger')

        let db = g_db.db_read({
            file: bf + 'billfish.db',
            type: DB_TYPE_IMPORT,
            readonly: true,
        })
        if (!db) return toast('加载数据库失败!', 'danger')

        let info = db.prepare('select * from library').get()
        if (info.version < 30) return toast('仅支持billfish-V3数据库...', 'danger')

        // g_tags && g_tags.reset();
        // g_folders && g_folders.reset();
        let temp = {
            tag: db.prepare('select * from bf_tag_v2;').all(),
            folder: db.prepare('select * from bf_folder;').all(),
            folder_ids: {},
            tag_ids: {}
        }
        const find = (type, id) => temp[type].find(item => item.id == id)
        const addFolder = (type, item) => {
            let inst = type == 'folder' ? g_folders : g_tags
            let { id, born, name, pid, desc, color } = item
            let _id = temp[type + '_ids'][id]
            if (_id == undefined) {
                color = [undefined, '#a3a3a3', '#f47272', '#f2b054', '#f3d919', '#90e968', '#5de0ce', '#62b7ff', '#ac5ce5', '#d571a3'][color]
                _id = temp[type + '_ids'][id] = inst.folder_add({
                    desc,
                    title: name,
                    ctime: born * 1000,
                    parent: pid ? addFolder(type, find(type, pid)) : '',
                    meta: { color },
                })
            }
            return _id
        }
        ['tag', 'folder'].forEach(type => temp[type].sort((a, b) => a.pid - b.pid).forEach(item => addFolder(type, item)))  // 按照顺序添加

        const getParents = (type, pid, cb) => {
            let list = []
            if (pid != 0) list.push(pid)
            while (true) {
                let item = find(type, pid)
                if (!item || item.pid <= 0) break
                list.unshift(item.pid)
                pid = item.pid
            }
            return list
        }

        let files = db.prepare('select * from bf_file;').all()
        let metas = {
            detail: db.prepare('select * from bf_material_userdata;').all(),
            image: db.prepare('select * from bf_material_v2;').all(),
            video: db.prepare('select * from bf_material_video;').all(),
            audio: db.prepare('select * from bf_material_video;').all(),
            tags: db.prepare('select * from bf_tag_join_file;').all(),
        }
        const findMetadata = (type, id, method = 'find') => metas[type][method](item => item.file_id == id) || {}

        let md5s = await g_data.getMd5List()

        let cancel = false
        let progress = g_progress.build({
            id: 'import1',
            datas: files.map(({ id, name }) => `[${id}]${name}`),
            title: '导入billfish库',
            callback(val) {
                if (val >= 100) {
                    g_data.data_import(r)
                } else {
                    cancel = true // 取消
                }
            }
        })

        let i = 0
        const next = async () => {
            let item = files[i++]
            if(item == undefined || cancel) return

            let { id, name, pid, file_size: size, ctime, mtime, md5, tid, born: date, is_link } = item
            const sloved = () => progress.setSloved(`[${id}]${name}`) & setTimeout(() => next(), 25)

            if (pid == -1 || md5s.includes(md5)) return sloved()// 排除回收站
            // 获取多层文件夹结构
            let parents = getParents('folder', pid)
            let file = nodejs.path.resolve(path, parents.map(_pid => find('folder', _pid).name).join('/'), name)
            if (is_link) {
                try {
                    file = nodejs.shell.readShortcutLink(file).target // 获取文件真实路径
                } catch (err) { }
            }
            if (!exists(file)) return sloved()

            let saveTo = await g_db.getSaveTo(md5)
            let cover = bf + '.preview/' + ("0" + id.toString(16)).slice(-2) + '/' + id + '.small.webp'

            nodejs.files.copySync(file, saveTo + name)
            exists(cover) && nodejs.files.copySync(cover, saveTo + 'cover.jpg')
            let json = {}
            let { w, h, colors } = findMetadata('image', id)
            let { note: desc, origin: url, score } = findMetadata('detail', id)
            json.width = w
            json.height = h

            let file_type = g_format.getFileType(name)
            if (file_type == 'audio') {
                let { duration, bit_rate } = findMetadata('audio', id)
                json.duration = duration
                json.bit_rate = bit_rate
            } else
                if (file_type == 'video') {
                    let { duration, ratotion } = findMetadata('video', id)
                    json.duration = duration
                    json.ratotion = ratotion
                }
            // billfish 颜色的格式是什么？？
            // if(typeof(colors) == 'string') colors.split('|').map(color => color.split(',')[1])
            g_data.data_set2({
                key: 'md5',
                value: md5,
                table: 'files',
                meta: Object.assign({
                    url, desc, score,
                    folders: [temp.folder_ids[pid]],
                    tags: findMetadata('tags', id, 'filter').map(({ tag_id }) => tag_id),
                }, json),
                data: {
                    md5, date, size,
                    title: name,
                    birthtime: date,
                }
            })
            sloved()
        }
        next()
    },

    async db_importFromEagle(path) {
        let r = {}
        let { exists } = nodejs.files
        let meta = path + '/metadata.json'
        if (!exists(meta)) return toast('此目录不是eagle数据目录!', 'danger')

        let dirs = nodejs.files.listDir(path + '/images')
        if (!dirs.length) return toast('没有找到任何素材', 'danger')

        meta = JSON.parse(nodejs.files.read(meta))
        // 获取所有目录
        // g_tags && g_tags.reset();
        // g_folders && g_folders.reset();

        let _folders = {}
        const find = (type, id) => temp[type].find(item => item.id == id)
        const addFolder = (item, parent = '') => {
            let { id, modificationTime: ctime, name: title, description: desc, iconColor: color, icon, password, passwordTips } = item
            let pid = _folders[id] = g_folders.folder_add({
                desc, title, ctime, icon, parent,
                meta: { color, password, passwordTips },
            })
            item.children.forEach(child => addFolder(child, pid))
        }
        meta.folders.forEach(item => addFolder(item))

        let cancel = false
        let progress = g_progress.build({
            id: 'import1',
            datas: dirs,
            title: '导入eagle库',
            callback(val) {
                if (val >= 100) {
                    g_data.data_import(r)
                } else {
                    cancel = true // 取消
                }
            }
        })

        let i = 0
        let md5s = await g_data.getMd5List()
        const next = async () => {
            let dir = dirs[i++]
            if (cancel || dir == undefined) return
            let json = dir + '/metadata.json'
            if (exists(json)) {
                try {
                    let { isDeleted, width, height, palettes, duration, annotation: desc, lastModified: date, btime: birthtime, name, id, size, star: score, tags, folders, url, ext } = JSON.parse(nodejs.files.read(json))
                    if (!isDeleted) {
                        let file = dir + '/' + name + '.' + ext
                        let md5 = nodejs.files.getFileMd5(file)
                        if (!md5s.includes(md5)) {

                            let saveTo = await g_db.getSaveTo(md5)
                            nodejs.files.copySync(file, saveTo + name + '.' + ext)
                            let cover = dir + '/' + name + '_thumbnail.png'
                            exists(cover) && nodejs.files.copySync(cover, saveTo + 'cover.jpg')

                            let colors = (palettes || []).map(v => v.color)
                            let comments = (json.comments || []).map(v => {
                                return {
                                    time: v.duration,
                                    text: v.annotation,
                                    date: v.lastModified
                                }
                            })
                            
                            g_data.data_set2({
                                key: 'md5',
                                value: md5,
                                table: 'files',
                                meta: {
                                    url, desc, score, colors, comments, width, height, duration, tags,
                                    folders: folders.map(fn => _folders[fn]),
                                },
                                data: {
                                    md5, date, size, birthtime,
                                    title: name + '.' + ext,
                                }
                            })
                        }
                    }
                } catch (e) { console.error(e) }
            }
            progress.setSloved(dir)
            setTimeout(() => next(), 25)
        }
        next()
    },
}).init()
