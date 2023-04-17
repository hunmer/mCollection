// ==UserScript==
// @name    数据库合并
// @version    1.1
// @author    hunmer
// @description    数据库合并到其他库
// @updateURL   
// @namespace    0fa26d6d-6f3d-408f-b9ae-20b1e2b2e409

// ==/UserScript==

var g_dbc = {
    init() {
        const self = this
        $(`<i class="ti ti-cloud-upload fs-2" data-action="dbc_modal" title="合并数据库"></i>`).appendTo('#icons_left')
        g_action.registerAction({
            dbc_modal() {
                self.modal()
            }
        })
    },

    modal() {
        g_form.confirm('form_dbc', {
            elements: {
                target: {
                    // TODO 数据库选择器
                    title: '目标数据库',
                    value: 'Y:\\阿里云盘\\library\\风景',
                    type: 'file_chooser',
                    required: true,
                    opts: {
                        properties: ['openDirectory'],
                    }
                },
                copyFile: {
                    title: '复制素材',
                    type: 'checkbox',
                    value: true,
                }
            }
        }, {
            id: 'dbc',
            title: '数据库合并',
            btn_ok: '开始',
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    this.test(g_form.getVals('form_dbc'))
                }
            }
        })

    },
     async test(opts) {
        let { target, copyFile } = opts
        let copy = (src, dest) => nodejs.fs.copy(src, dest, { overwrite: true })
        
        let query = 'SELECT md5,tags,folders,desc FROM files' // ,title
        let targetDB = target + '\\items.db'

        let cachePath = _dataPath + '\\copy_cache\\'
        nodejs.files.removeDir(cachePath + 'files')

        let cacheDB = cachePath + 'items.db'
        let err = await copy(targetDB, cacheDB)
        if (err) return console.error(err)

        g_client.send('db_close', { db: cacheDB })
        let db = g_db.db_read({
            file: cacheDB,
            readonly: false,
            type: DB_TYPE_IMPORT,
        })

        const run = async () => {
            let from = await g_data.all(query)
            console.log(from.length)
            let to = await g_data.all(query, cacheDB)
            console.log(to.length)

            let add = from.filter(item => to.find(v => isObjEqual(v, item)) === undefined)
            // add = add.slice(0, 5)
            let max = add.length
            if (!max) return toast('没有任何改动', 'danger')
            let cancel = false
            console.log(add.map(md5 => md5))

            let progress = new Progress('dbc', {
                datas: add.map(item => item.md5),
                autoClose: true,
                onClose: function() {
                    g_modal.remove('progress_dbc')
                }
            })
            progress.build(async html => {
                alert(html, {
                    id: 'progress_dbc',
                    title: '合并数据库中...',
                    btn_ok: '取消',
                    scrollable: true,
                }).then(() => {
                    if (progress.val < 100) {
                        cancel = true // 取消
                    }
                })
                let n = 0
                let i = 0
                let uploader = getConfig('username')
                let items = await Promise.all(add.map(({ md5 }) => g_data.data_getData(md5)))
                let next = async () => {
                    if (cancel) return
                    let item = items.shift()
                    try {
                        if (!item) {
                            // err = await copy(cacheDB, targetDB)
                            // if (err) return console.error(err)
                            copy(g_db.opts.path + '\\folders.json', cachePath + '\\folders.json')
                            // TODO 文件夹数据同步
                            g_client.send('db_close', { db: cacheDB })
                            // setTimeout(() => nodejs.fs.removeSync(cacheDB), 2000)
                            return ipc_send('openFolder', cachePath)
                        }
                        let { md5, title } = item
                        progress.setSloved(md5, true, `<p><b class="text-success">√ 成功导入:</b>\n<b>${title}</b></p>`)
                        item.json.uploader = uploader

                        let ret = await g_data.data_setWithDB(md5, item, cacheDB)
                        if (ret.changes) n += ret.changes
                        copyFile && await copy(g_db.getSaveTo(md5), g_db.getSaveTo(md5, cachePath))

                    } catch (err) {

                    }

                    next()
                }
                next()
            })
        }

        g_pp.set('db_imported', data => {
            console.log(data)
            run()
        })

    }
}
g_dbc.init()
