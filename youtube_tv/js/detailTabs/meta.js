let g_meta = {
    cache: {},
    init() {
        const self = this
        g_action.registerAction({
            meta_load: () => {
                g_meta.meta_get(self.lastFile, true)
            }
        })
    },
    // 获取媒体信息
    meta_get(file, show = false) {
        this.lastFile = file
        if (show) {
            if (this.cache[file]) return this.meta_load(this.cache[file])
            $('#tab_meta button').addClass('btn-loading')
            g_ffmpeg.video_meta(file).then(meta => {
                this.cache[file] = meta
                this.meta_load(meta)
            })
        } else {
            $('#tab_meta').html(`<button data-action="meta_load" class="btn d-block btn-pill mx-auto btn-primary mt-2">加载媒体信息</button>`)
        }

    },

    meta_load(meta) {
        let h = ''
        let { format, streams } = meta
        let video = streams[0]
        for (let [k, v] of Object.entries({
                大小: renderSize(format.size),
                时长: getTime(format.duration),
                分辨率: video.width + 'x' + video.height,
                编码: video.codec_name,
                画面比: video.display_aspect_ratio,
                地址: format.filename,
            })) {
            h += `
              <div class="datagrid-item">
                <div class="datagrid-title">${k}</div>
                <div class="datagrid-content">${v}</div>
              </div>
            `
        }
        $('#tab_meta').html(`<div class="datagrid">${h}</div>`)
    }
}
g_detailTabs.register('meta', {
    index: 3,
    onTabChanged: old => {

    },
    onVideoEvent: (type, { tab }) => {
        if (type == 'show') {
            g_meta.meta_get(g_videoTabs.getTabValue('data', tab).file)
        }
    },
    tab: {
        id: 'meta',
        title: '<i class="ti ti-alert-circle fs-2"></i>',
        html: `
            <div class="overflow-y-auto h-full" style="padding-bottom: 50px;" id="tab_meta">
               
            </div>
            `
    },
}, g_meta)