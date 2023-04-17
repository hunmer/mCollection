// ==UserScript==
// @name        数据库升级
// @version     1.0
// @author      hunmer
// @updateURL   
// @description 
// ==/UserScript==

({
    init() {
        g_plugin.registerEvent('db_connected', async ({ opts }) => {
            if (opts.type === DB_TYPE_DEFAULT) {
                // g_data.data_set2({
                //     "value": "50b6dac749bc45a7d1a4b3475f3dd698",
                //     "key": "md5",
                //     "table": "files",
                //     "meta": {
                //         "width": 1280,
                //         "height": 720,
                //         desc: 'this is desc',
                //         score: 3,
                //         url: 'https://www.baidu.com',
                //         folders: ["test_folder"],
                //         tags: ["test_tag"],
                //         "colors": [[25,25,18],[216,218,206],[116,120,113],[73,73,60],[57,63,58],[89,96,91],[143,151,146],[75,83,84],[122,135,142]],
                //         "duration": 9.734
                //     },
                //     "data": {
                //         "md5": "50b6dac749bc45a7d1a4b3475f3dd698",
                //         "date": 1670823905179,
                //         "size": 1622599,
                //         "title": "1660726370255.mp4",
                //         "birthtime": 1660726370400
                //     }
                // })

                let version = await g_db.db_getConfig('version', 1) * 1
                console.log(version)
                if (version < 2) {
                    confirm('是否进行数据库升级?').then(() => this.db_update())
                }
            }
        })


    },
    async db_update() {
        let folders_id = {}
        const splitStr = str => str.split('||').filter(s => s != '')

        g_tags && g_tags.reset();
        g_folders && g_folders.reset();

        // let max = 10
        let i = 0
        let files = await g_data.all('SELECT * FROM videos')
        let max = files.length

        let folderList = g_db.db_readJSON('folders')
        const getFolderID = fid => {
            let id = folders_id[fid]
            if (!id) {
                let folder = folderList[fid]
                if (folder) {
                    id = folders_id[fid] = g_folders.folder_add({
                        title: folder.title,
                        icon: folder.icon,
                        parent: getFolderID(folder.parent)
                    })
                }
            }
            return id || ''
        }

        const next = async () => {
            let item = files.shift()
            if (!item) {
                toast('升级成功,即将刷新')
                await g_db.db_setConfig('version', 2)
                setTimeout(() => location.reload(), 3000)
            }

            let { id, tags, folders, json, date, birthtime, size, score, desc, link, deleted, title, ext, md5 } = item
            if (!deleted) {
                title += '.' + ext
                await g_data.data_set2({
                    value: md5,
                    key: 'md5',
                    table: 'files',
                    meta: Object.assign({
                        desc,
                        score,
                        folders: g_data.arr_split(folders, '||').map(fid => getFolderID(fid)),
                        url: link,
                        tags: g_data.arr_split(tags, '||'),
                    }, JSON.parse(json)),
                    data: {
                        md5,
                        date,
                        size,
                        title,
                        birthtime,
                    }
                })
            }
            setTimeout(() => next(), 20)
            console.log(`[${parseInt(++i / max * 100)}%]${title}`)
        }
        next()
    }
}).init()