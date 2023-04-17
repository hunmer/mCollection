(() => {

    // 获取导入的视频信息并储存到独立db
     g_plugin.registerEvent('db_connected', ({db}) => {
        db.exec(`
        CREATE TABLE IF NOT EXISTS media_meta(
            fid      INTEGER PRIMARY KEY,
            duration INT,
            width    INT,
            height   INT,
            frame    TINYINT,
            bit_rate INT,
            sample_rate INT
        );`)
        
        g_datalist.sort.register('duration', {
            title: '时长',
            async callback(items){
                for(let k in items){
                    let v = items[k]
                    let meta = await getMeta(v)
                    v.duration = meta?.duration || 0
                }
                return items.sort((a, b) => b.duration - a.duration)
            }
        })

        g_datalist.sort.register('px', {
            title: '分辨率',
            async callback(items){
                for(let k in items){
                    let v = items[k]
                    let meta = await getMeta(v)
                    v.px = (meta?.width || 0) + (meta?.height || 0)
                }
                return items.sort((a, b) => b.px - a.px)
            }
        })
    })
    g_data.table_indexs.media_meta = ['fid', 'duration', 'width', 'height', 'frame', 'bit_rate', 'sample_rate']

    const removeMeta = (fid) => g_data.data_remove2({table: 'media_meta', key: 'fid', value: fid})
    const setMeta = (fid, data) => {
        if(data){
            data = Object.assign({
                fid,
                duration: 0,
                width: 0,
                height: 0,
                frame: 0,
                bit_rate: 0,
                sample_rate: 0,
            }, data)
            return g_data.data_set2({ table: 'media_meta', key: 'fid', value: fid, data})
        }
    }
    const getMeta = async d => g_data.getMetaInfo(d, 'media')
    const loadMeta = async (data, fid) => {
        if (['video', 'audio'].includes(g_format.getFileType(data.title))) {
            let json = data.json || {}
            let file = data.file || await g_item.item_getVal('file', data.md5)
            let streams = (await g_ffmpeg.video_meta(file)).streams
            const getStream = name => streams.find(({ codec_type }) => codec_type == name)

            let audio = getStream('audio')
            let video = getStream('video')
            if (audio) {
                let { bit_rate, sample_rate, duration } = audio
                Object.assign(json, { bit_rate, sample_rate, duration })
            }

            if (video) {
                let { width, height, avg_frame_rate: frame, duration } = video
                Object.assign(json, { width, height, frame, duration }) // 覆盖音频，以视频长度为标准
            }

            if (json.duration) {
                if (fid == undefined) fid = data.id
                setMeta(fid, json)
                return json
            }
        }
    }
    g_detail.inst.media = { set: setMeta, get: getMeta, load: loadMeta, remove: removeMeta }

    g_plugin.registerEvent('onBeforeShowingDetail', async ({ items, columns }) => {
        if (items.length == 1) {
            let d = items[0]
            let meta = await getMeta(d)
            const init = (meta, update) => {
                if(!meta) return

                let type = g_format.getFileType(d.title)
                if (type == 'video') {
                    Object.assign(columns.status.list, {
                        px: {
                            title: '分辨率',
                            class: 'bg-orange-lt',
                            getVal: () => meta.width + 'x' + meta.height
                        },
                        frame: {
                            title: '帧数',
                            class: 'bg-orange-lt',
                            getVal: () => meta.frame
                        }
                    })
                } else
                if (type == 'audio') {
                    Object.assign(columns.status.list, {
                        rate: {
                            title: '采样率',
                            class: 'bg-orange-lt',
                            getVal: () => meta.sample_rate
                        },
                        bit_rate: {
                            title: '比特率',
                            class: 'bg-orange-lt',
                            getVal: () => meta.bit_rate
                        },
                    })
                }
                Object.assign(columns.status.list, {
                    duration: {
                        title: '时长',
                        class: 'bg-orange-lt',
                        getVal: () => getTime(meta.duration)
                    }
                })
                update && g_detail.updateColumns('status')
            }
            
            if (!meta) {
                loadMeta(d).then(meta => init(meta, true))
            }else{
                init(meta)
            }
        }
    })

    g_plugin.registerEvent('db_afterInsert', async ({ opts, ret, method, meta }) => {
        let { table, data } = opts
        if (table == 'files'){
            let fid = ret.lastInsertRowid
            if(fid > 0 && meta && ['video', 'audio'].includes(g_format.getFileType(data.title))){
                setMeta(fid, {
                    duration: meta.duration || 0,
                    width: meta.width || 0,
                    height: meta.height || 0,
                })
            }else
            if(method == 'insert'){
                loadMeta(data, ret.lastInsertRowid)
            }
        }
    })

})()