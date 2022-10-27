var g_ffmpeg = {
    init() {
        this.path = require('path')
        // this.task_add([])

    },

    tasks: {},

    // 任务队列
    query() {

    },

    task_add(list) {

    },

    task_remove() {

    },

    async video_cover(md5, time = 0) {
        let d = await g_data.data_get(md5)
        let file =  g_item.item_getVal('file', d)
        if (!nodejs.files.exists(file)) return
        let saveTo = g_db.getSaveTo(md5) + 'cover.jpg'

        g_ffmpeg.video_cover1({
            params: time,
            input: file,
            output: saveTo,
            size: '240x180',
        }, () => {
            g_item.item_setCover(md5, saveTo)
        })
    },

    // 封面裁剪
    video_cover1(opts, callback) {
        nodejs.files.makeSureDir(opts.output)
        let obj = new nodejs.cli.ffmpeg(opts.input)
            .screenshots({
                timestamps: opts.params,
                folder: this.path.dirname(opts.output),
                filename: this.path.basename(opts.output),
                size: opts.size
            }).on('end', function() {
                callback();
            }).on('error', function() {

            });
    },

    // 视频信息
    video_meta(input, callback) {
        return new Promise(reslove => {
            nodejs.cli.ffprobe(input).then(metadata => {
                typeof(callback) == 'function' ? callback(metadata): reslove(metadata)
            });
        })
    },

    // 生成频谱
    async wavePic(md5) {
        let d = await g_data.data_get(md5)
        let file = g_item.item_getVal('file', d)
        if (!nodejs.files.exists(file)) return
        let saveTo = g_db.getSaveTo(md5) + 'wave.png'

        let obj = new nodejs.cli.ffmpeg(file)
            // TODO 根据媒体长度决定宽度，不然媒体长的不明显
            .setParam('-filter_complex', 'showwavespic=s=640x120')
            .setParam('-frames:v', '1')
            .on('end', function() {
                // TODO 当前preview 更新封面
                
            })
            .on('error', function(err) {
                console.log(err)
            })
            .save(saveTo)
    }
}

g_ffmpeg.init()
// g_ffmpeg.video_cover1({
//  params: 0,
//  input: 'X:\\aaa\\videos\\1660754068786.mp4',
//  output: 'I:/software\\mCollecion\\resources\\app\\res\\cover2.jpg',
//  size: '200x200',
// }, (...args) => console.log(args))

// g_ffmpeg.video_meta('X:\\aaa\\videos\\1660754068786.mp4', meta => console.log(meta))