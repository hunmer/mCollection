// ==UserScript==
// @name    音视频exif
// @version    1.0
// @author    hunmer
// @description    储存视频音频exif,并添加过滤器
// @updateURL   https://neysummer2000.fun/mCollection/scripts/音视频exif.txt
// @namespace    23216309-d490-41ae-988b-ec72b10bbfa1

// ==/UserScript==
({

    removeExif(fid) {
        return g_data.data_remove2({ table: 'exif_meta', key: 'fid', value: fid })
    },

    setExif(fid, data) {
        return g_data.data_set2({ table: 'exif_meta', key: 'fid', value: fid, data: { fid, data } })
    },

    async getExifData(d) {
        return obj_From_key(await g_data.getMetaInfo(d, 'exif'), 'exif').data
    },

    readExif(file) {
        return new Promise(reslove => {
            let output = ''
            nodejs.cli.run(nodejs.cli.getExecName(nodejs.dir + `/bin/exiftool`), ['-j', `"${file}"`], {}, {
                onOutput: msg => output += msg,
                onExit() {
                    reslove(JSON.parse(output)[0])
                }
            })
        })
    },
    
    async status(md5) {
        g_menu.hideMenu('datalist_item')
        let file = await g_item.item_getVal('file', md5)
        this.readExif(file).then(json => {
            prompt(JSON.stringify(json, null, 2), { title: 'exif信息', width: '80%', rows: 20 })
        })
    },

    updateExif(data){
        return new Promise(reslove => {
            if(['image', 'video', 'audio'].includes(getFileType(data.title))){
                let inst = g_detail.inst.exif
                inst.read(data.file).then(json => {
                    if (json) {
                        g_plugin.callEvent('getExifData', {json, data})
    
                        let exif = {}
                        for (let [k, v] of Object.entries(inst.names)) {
                            if (json[k]) exif[k] = json[k]
                        }
                        if(['Make', 'AndroidManufacturer', 'Album'].findIndex(k => Object.keys(exif).includes(k)) == -1) return // 普通的文件...
                        inst.set(fid, JSON.stringify(exif))
                        reslove(json)
                    }
                })
            }
        })
    },

    init() {
        g_menu.list.datalist_item.items.push({
            text: '查看exif信息',
            icon: 'list',
            class: 'text-warning',
            action: 'exif_status',
        })

        g_action.registerAction({
            exif_status: () => this.status(g_menu.key),
        })

        g_plugin.registerEvent('db_connected', ({db}) => {
            g_db.db.exec(`
            CREATE TABLE IF NOT EXISTS exif_meta(
               fid      INTEGER PRIMARY KEY,
               data    TEXT(64)
            );`)
        })

        g_data.table_indexs.exif_meta = ['fid', 'data']
        g_plugin.registerEvent('db_afterInsert',  ({ opts, ret, method }) => {
            let fid = ret.lastInsertRowid
            let data = opts.data
            if (fid > 0 && method == 'insert' && opts.table == 'files') {
                this.updateExif(data)
            }
        })

        g_plugin.registerEvent('onBeforeShowingDetail', async ({ items, columns, type }) => {
            if (items.length == 1 && type == 'sqlite') {
                let data = await this.getExifData(items[0])
                if (data) {
                    data = Object.entries(JSON.parse(data))
                    Object.assign(columns.status.list, {
                        exif: {
                            title: 'exif',
                            class: 'bg-yellow-lt',
                            getVal: () => `<a href='#' title='${data.map(([k, v]) => g_detail.inst.exif.names[k]+' : '+v).join("\n")}'>${data.length - 1}项</a>` // 除去type
                        },
                    })
                }

            }
        })

        if(g_dropdown.list.tools_list){
            Object.assign(g_dropdown.list.tools_list.list, {
                exif_checkSelected: {
                    title: '更新选中图片Exif信息',
                    icon: '',
                    class: 'text-primary',
                    action: 'exif_checkSelected',
                },
                // exif_checkAll: {
                //     title: '更新所有图片Exif信息',
                //     icon: '',
                //     class: 'text-primary',
                //     action: 'exif_checkAll',
                // },
            })
            const multiUpdate = data => {
                let list = toArr(data)
                let len = list.length
                let cnt = 0
                list.forEach(data => {
                    g_detail.inst.exif.update(data).then(() => {
                        if(++cnt == len){
                            toast('更新完毕！', 'success')
                        }
                    })
                })
            }
            
            g_action.registerAction({
                exif_checkSelected: () => multiUpdate(g_detail.selected_items),
                exif_checkAll: () => toast('TODO')
            })
        }

        g_detail.inst.exif = { set: this.setExif, get: this.getExifData, remove: this.removeExif, update: this.updateExif, read: this.readExif, names: {
            ISO: 'ISO',
            Make: '相机品牌',
            Model: '相机型号',
            AndroidModel: '相机型号',
            DateTimeOriginal: '拍摄时间',
            CreateDate: '拍摄时间',
            AvgBitrate: '码率',
            FNumber: '光圈值',
            FocalLength: '焦距',
            AndroidManufacturer: '相机品牌',
            ExposureTime: '曝光时间',
            Flash: '闪光灯状态',
            WhiteBalance: '白平衡',
            Distance: '焦点距离',
            GPSLongitude: '经度',
            GPSLatitude: '纬度',
            GPSAltitude: '海拔高度',
            VideoFrameRate: '帧率',
            PreferredVolume: '音量',
    
            Title: '歌曲',
            Album: '专辑',
            Artist: '艺术家',
            Track: '轨道数',
            PictureMIMEType: '封面',
            // ID3Size
            // AudioBitrate: '比特率',
        }}
    }

}).init()
