g_db.init({
    db_class: require('./database.js'), // require('better-sqlite3')
    table_sqlite: `
        CREATE TABLE IF NOT EXISTS videos(
         id      INTEGER PRIMARY KEY AUTOINCREMENT,
         tags   TEXT,
         folders TEXT,
         json   TEXT,
         date   INTEGER,
         birthtime INTEGER,
         size   INTEGER,
         score  TINYINT,
         desc   TEXT,
         link   TEXT,
         ext   CHAR,
         deleted BOOLEAN,
         title   VARCHAR(256),
         md5    CHAR(32)           NOT NULL
     );`,
    db_menu: {
        openEagle: {
            title: '导入eagle素材库',
            action: 'db_openEagle',
        },
    },

    getOption(opts){
        return {
            readonly: opts.file.startsWith('Y')
        }
    },

    init() {
        g_action.registerAction({
            db_openEagle: () => {
                openFileDiaglog({
                    title: '打开eagle素材库',
                    properties: ['openDirectory'],
                }, path => {
                    path.length && this.db_importFromEagle(path[0])
                })
                // g_form.confirm1({
                //     id: 'db_edit',
                //     elements: {
                //         // TODO 导入选项(是否标签，注释等)
                //         path: {
                //             title: '储存目录',
                //             type: 'file_chooser',
                //             required: true,
                //             opts: {
                //                 title: '选择eagle数据库',
                //                 properties: ['openDirectory'],
                //             },
                //         },
                //     },
                //     title: '导入eagle素材库',
                //     callback: ({ vals }) => {
                //         console.log(vals)
                //         
                //     }
                // })
            }
        })


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
                    if($('#checkbox_import_auto').prop('checked')) btn[0].click()
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

        // TODO 

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
})