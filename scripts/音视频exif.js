// ==UserScript==
// @name    音视频exif
// @version    1.0
// @author    hunmer
// @description    储存视频音频exif,并添加过滤器
// @updateURL   https://neysummer2000.fun/mCollection/scripts/音视频exif.txt
// @namespace    23216309-d490-41ae-988b-ec72b10bbfa1

// ==/UserScript==
({
    names: {
        Make: '相机品牌',
        AndroidManufacturer: '相机品牌',

        Model: '相机型号',
        AndroidModel: '相机型号',

        DateTimeOriginal: '拍摄时间',
        CreateDate: '拍摄时间',

        AvgBitrate: '码率',

        FNumber: '光圈值',
        FocalLength: '焦距',
        ISO: 'ISO',
        ExposureTime: '曝光时间',
        Flash: '闪光灯状态',
        WhiteBalance: '白平衡',
        Distance: '焦点距离',
        GPSLongitude: '经度',
        GPSLatitude: '纬度',
        GPSAltitude: '海拔高度',
        VideoFrameRate: '帧率',

        PreferredVolume: '音量',

        // 音频
        Title: '歌曲',
        Album: '专辑',
        Artist: '艺术家',
        Track: '轨道数',
        PictureMIMEType: '封面',
        // ID3Size
        // AudioBitrate: '比特率',
    },

    indexs: ['Make', 'AndroidManufacturer', 'Album'], // 包含这些才选择记录

    parseExif(json) {
        let r = {}
        for (let [k, v] of Object.entries(this.names)) {
            if (json[k] && !r[k] && k != 'type') r[k] = json[k]
        }
        return r
    },

    removeExif(fid) {
        return g_data.data_remove2({ table: 'exif_meta', key: 'fid', value: fid })
    },

    setExif(fid, data) {
        return g_data.data_set2({ table: 'exif_meta', key: 'fid', value: fid, data: { fid, data } })
    },

    async getExifData(fid) {
        return (await g_data.data_get1({ table: 'exif_meta', key: 'fid', value: fid }) || {}).data
    },

    getExif(file) {
        return new Promise(reslove => {
            let output = ''
            nodejs.cli.run(__dirname + `/bin/exiftool.exe`, ['-j', `"${file}"`], {}, {
                onOutput: msg => output += msg,
                onExit() {
                    reslove(JSON.parse(output)[0])
                }
            })
        })
    },

    status(md5) {
        g_menu.hideMenu('datalist_item')
        let file = g_item.item_getVal('file', md5)
        this.getExif(file).then(json => {
            prompt(JSON.stringify(json, null, 2), { title: 'exif信息', width: '80%', rows: 20 })
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

        g_plugin.registerEvent('db_connected', () => {
            g_db.db.exec(`
            CREATE TABLE IF NOT EXISTS exif_meta(
               fid      INTEGER PRIMARY KEY,
               data    TEXT(64)
            );`)
        })

        g_data.table_indexs.exif_meta = ['fid', 'data']
        g_plugin.registerEvent('db_afterInsert', async ({ opts, ret, meta, method }) => {
            let fid = ret.lastInsertRowid
            let data = opts.data
            let type = g_format.getFileType(data.title)
            if (fid > 0 && method == 'insert' && opts.table == 'files' && ['image', 'video', 'audio'].includes(type)) {
                let json = await this.getExif(data.file)
                // console.log(json)
                if (json) {
                    let exif = this.parseExif(json)
                    let keys = Object.keys(exif)
                    if(this.indexs.findIndex(k => keys.includes(k)) == -1) return // 普通的文件...
                    exif.type = type

                    // console.log(exif)
                    this.setExif(fid, JSON.stringify(exif))
                }
            }
        })

        g_plugin.registerEvent('onBeforeShowingDetail', async ({ items, columns }) => {
            if (items.length == 1) {
                let data = await this.getExifData(items[0].id)
                if (data) {
                    data = Object.entries(JSON.parse(data))
                    Object.assign(columns.status.list, {
                        exif: {
                            title: 'exif',
                            class: 'bg-yellow-lt',
                            getVal: () => `<a href='#' title='${data.map(([k, v]) => this.names[k]+' : '+v).join("\n")}'>${data.length - 1}项</a>` // 除去type
                        },
                    })
                }

            }
        })
    }

}).init()
