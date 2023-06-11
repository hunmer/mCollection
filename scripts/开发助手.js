// ==UserScript==
// @name    开发助手
// @version    1.0
// @author    hunmer
// @icon      bug:red
// @updateURL   https://neysummer2000.fun/mCollection/scripts/开发助手.js
// @description    一些便利功能
// @namespace    72a45071-9af7-4c6c-8c3b-454d80039af0
// ==/UserScript==

({

    getDBFiles(basePath){
       basePath ??= g_db.getSaveTo()
       return flattenArray(nodejs.files.listDir(basePath).map(dir => nodejs.files.listDir(dir).map(dir => nodejs.files.listDir(dir)))).map(dir => getFileName(dir))
    },
    init() {
       const self = this
       g_hotkey.register('ctrl+shift+t',  {
            title: '更多工具',
            content: "g_dropdown.quickShow('tools_list')",
            type: 2,
        })
        let list = {
            icons: {
                title: '图标查看器',
                icon: 'icons',
                action: 'icon_test',
            },
            check_covers: {
                title: '检查视频封面',
                icon: 'photo-question',
                action: 'check_covers',
            },
            db_clear: {
                title: '清空数据库',
                icon: 'trash',
                class: 'text-danger',
                action: 'db_clear',
            },
            debug_covers_delete: {
                title: '删除选中封面',
                icon: 'photo-off',
                class: 'text-danger',
                action: 'debug_covers_delete',
            },
            copyDateFolders: {
                title: '导出指定日期素材库',
                action: 'copyDateFolders',
            },
            check_existsFiles: {
                title: '恢复数据文件',
                icon: '',
                class: 'text-primary',
                action: 'check_existsFiles',
            },
        }
        g_dropdown.register('tools_list', {
            position: 'end-top',
            offsetLeft: 5,
            autoClose: true,
            list,
        })

       $(`<i class="ti ti-dots fs-2" data-action="dropdown_show,tools_list" title="更多工具"></i>`).appendTo('#icons_left')

        g_plugin.registerEvent('doAction,db_clear', async () => {
            if((await g_data.getMd5List()).length > 50){
                if(!(await confirm('你的素材库数量超过了 50,你确定要删除吗?此动作会同时删除素材库内的素材！'))) return false
            }
            nodejs.files.removeDir(await g_db.getSaveTo())
        })

        g_action.registerAction({
            check_covers: async () => {
                g_data.getMd5List().then(list => {
                    toast('开始检查封面中...请稍等...')
                    list.forEach(md5 => g_item.item_getVal('cover', md5))
                })
            },
            debug_covers_delete: () => {
                Promise.all(g_detail.selected_keys.map(async md5 => nodejs.files.remove(await g_item.item_getVal('cover', md5))))
                .then(() => {
                    toast('成功删除选中封面')
                })
            },
            check_oldFiles: async () => {
                let list1 = this.getDBFiles()
                let list2 = await g_data.getMd5List()
                arr_compare(list1, list2)
            },
             check_existsFiles: async () => {
                let list1 = this.getDBFiles()
                let list2 = await g_data.getMd5List()
                let files = []
                Promise.all(arr_compare(list1, list2).removed.map(async md5 => {
                    let path = g_db.getSaveTo(md5)
                    nodejs.files.dirFiles(path).then(list => {
                        console.log(list)
                        let file = list.filter(file => !['cover.jpg'].includes(getFileName(file)))
                        if(file.length) files.push(file[0])
                    })
                })).then(() => {
                    g_data.file_revice(files).then(() => toast('成功恢复'+files.length+'个文件', 'success'))
                })
            },
            copyDateFolders(){
                let def = '2023-04-26 00:00' || getFormatedTime(5)
                prompt(def, {title: '输入起始日期'}).then(async date => {
                    date = new Date(date).getTime()
                    if(isNaN(date)) return toast('错误的日期格式', 'danger')
                    console.log(date)
                    let list = (await g_data.all('SELECT md5 from files where date > '+date)).map(({md5}) => md5)
                    let len = list.length
                    if(!len) return toast('没有找到符合条件的素材', 'danger')
                    g_form.confirm1({
                        id: 'copyDateFolders',
                        title: '总共发现'+len+'个素材，请选择导出位置',
                        elements: {
                            path: {
                                title: '导出目录',
                                type: 'file_chooser',
                                required: true,
                                value: '',
                                opts: {
                                    title: '选择导出的目录',
                                    properties: ['openDirectory'],
                                },
                            },
                        },
                        callback({vals}){
                            // TODO QUEUE绑定进度提示
                            list.forEach(md5 => {
                                let old = g_db.getSaveTo(md5)
                                let target = vals.path+g_db.getSaveTo(md5, '')
                                console.log(nodejs.fs.copySync(old, target))
                            })
                            toast('复制成功！', 'success')
                        }
                    })
                })
            },
        })
    },
}).init()
