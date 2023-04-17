g_preview.register([...g_format.getCategory('video'), ...g_format.getCategory('audio')], {
    onPreview(ev) {
        let {file, format, data, dom, opts} = ev
        let isVideo = g_format.getFileType(file) == 'video'
        ev.html = `
            <div id="item_preview" class="position-relative p-0 m-0">
                <video src="${fileToUrl(file)}" poster="${g_item.item_getVal('cover', data)}" class="w-full" autoplay loop onclick="toggleVideoPlay(this)" data-out="item_unpreview" data-outfor="item_preview" height="${dom.height}px"></video>
                <div class="progress position-absolute bottom-0 w-full" style="height: 3px; pointer-events: none;">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
                </div>
                ${isVideo ? `<a data-action="preview_mute" class="position-absolute top-5 end-5 rounded-circle btn p-1 "><i class="ti ti-volume"></i></a>` : ''}
                <span class="badge position-absolute end-5 bottom-10">
                    00:00:00
                </span>
            </div>
        `

        ev.cb = div => {
            let video = div.find('video')
            opts = Object.assign(opts, {
                'alt': 1,
                'ctrl': 5,
                'shift': 'duration * 0.01',
                'alt+shift': 'duration * 0.05',
                'ctrl+shift': 'duration * 0.1',
            })

            video[0].addEventListener('timeupdate', function(e) {
                div.find('.badge').html(getTime(this.currentTime))
                div.find('.progress-bar').css('width', (this.currentTime / this.duration * 100).toFixed(1) + '%')
            })

            setTimeout(() => {
                let last = 0
                video.
                on('mousemove', function(e) {
                    let pos = e.originalEvent.offsetX / $(this).width();
                    if (Math.abs(last - pos) >= 0.005) {
                        video[0].currentTime = video[0].duration * pos
                    }
                    last = pos
                }).
                on('mouseleave', e => {
                    g_preview.unpreview()
                    video[0].load() // 停止视频加载
                }).
                on('mousewheel', function(e) {
                    if (!$('input:focus').length) {
                        e = e.originalEvent
                        let key = g_hotkey.getInputCode(e, 'key')
                        if (key == '') return;
                        let video = e.currentTarget
                        let duration = video.duration
                        if (!isNaN(duration)) {
                            let add = eval(opts[key]) || 1
                            if (add < 1) add = 1;
                            video.currentTime += e.deltaY > 0 ? 0 - add : add;
                            clearEventBubble(e);
                        }
                    }
                })
            }, 750) // 延迟绑定
            isVideo && g_setting.apply('preview_mute')
        }
    },
    onFullPreview(ev) {
        let {file, format, data, dom, opts} = ev
        ev.html = `
            <dplayer class="w-full"></dplayer>
        `
        ev.cb = modal => {
            g_preload.check('dplayer', () => {
                let div = modal.find('dplayer')
                let config = {
                    hotkey: true,
                    autoplay: true,
                    volume: 1,
                    container: div[0],
                    screenshot: true,
                    video: {
                        url: fileToUrl(file),
                        pic: g_item.item_getVal('cover', ev.data)
                    },
                    pluginOptions: {
                        flv: {
                            mediaDataSource: {},
                            config: {
                                lazyLoad: false,
                            },
                        },
                    },
                    contextmenu: [{
                        text: '打开文件位置',
                        click() {

                        },
                    }]
                }
                let player = new DPlayer(config)
                player.on('loadeddata', e => {})
                player.on('error', e => {
                    toast('加载文件失败', 'danger')
                })
            })

        }
    }
})
