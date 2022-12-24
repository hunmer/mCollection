let g_video = {
    cache: {},
    init() {
        const self = this
          g_menu.registerMenu({
            name: 'videoplayer_item',
            selector: 'video',
            dataKey: 'src',
            items: [{
                icon: 'link',
                text: '复制链接',
                action: 'videoplayer_copyLink'
            }, {
                icon: 'player-play',
                text: '播放',
                action: 'videoplayer_open'
            }]
        });
        
        g_action.registerAction(['videoplayer_copyLink', 'videoplayer_open'], (dom, action) => {
            let url = decodeURI(g_menu.key.replace('file://', '')).replaceAll('%23', '#')
            switch (action[0]) {
                case 'videoplayer_copyLink':
                    ipc_send('copy', url)
                    break;
                case 'videoplayer_open':
                    ipc_send('openFile', url)
                    break;
            }
            g_menu.hideMenu('videoplayer_item')
        })

        g_action.registerAction({
            video_prev() {
                self.video_prev()
            },
            video_next() {
                self.video_next()
            },
            video_loadVid(dom) {
                g_video.target = dom
                self.video_loadVid(getParentAttr(dom, 'data-vid'))
            },
            video_download(dom) {
                // TODO 自定义下载格式
                let saveTo = self.video_getSaveTo(g_video.preview)
                if (nodejs.files.exists(saveTo)) {
                    return ipc_send('openFolder', saveTo)
                }
                dom = $(dom)
                let { video: url } = g_video.preview
                let showMsg = (msg, type) => {
                    (msg, type, 6000)
                }
                dom.html(`
                     <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                     <b>0%</b>
                `)
                downloadFile({
                    url,
                    saveTo,
                    opts: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.35',
                            'referer': 'https://www.douyin.com/'
                        }
                    },
                    onProgress(i) {
                        dom.find('b').html(i + '%')
                    },
                    onComplete(file) {
                        toast('下载成功', 'success')
                        dom.html('<i class="ti ti-folder fs-2"></i>')
                    },
                    onError(err) {
                        toast(err, 'danger')
                        dom.html('<i class="ti ti-download fs-2"></i>')
                    }
                })
            },
            video_copyLink() {
                g_api.douyin_shortenURL("https://www.iesdouyin.com/share/video/" + g_video.preview.aid).then(url => {
                    g_clipboard.lastURL = url // todo 全局跳过从软件复制的链接
                    ipc_send('copy', g_video.preview.desc + ' ' + url)
                })
            },
            video_chart() {
                g_browser.openURL('default', 'https://www.chanmama.com/awemeDetail/' + g_video.preview.aid + '/comment')
            },
            video_web() {
                ipc_send('url', 'https://www.douyin.com/video/' + g_video.preview.aid)
            },
            video_tag() {

            },

        })

        this.range = noUiSlider.create($('#range_video')[0], {
            start: 0,
            connect: 'lower',
            tooltips: [{
                to: function(value) {
                    return getTime(value);
                }
            }],
            range: {
                min: 0,
                max: 0
            }
        })
        this.range.on('slide', function(values, handle, unencoded) {
            player.currentTime = unencoded[0]
        });


        let player = $('#tab_video video')[0]
        player.tried = 0
        player.ontimeupdate = e => {
            this.range.set(parseInt(player.currentTime))
        }
        player.onloadstart = e => {
            player.tried = 0
        }
        player.onerror = e => {
            if (++player.tried > 2) {
                toast('视频加载失败!可能已被删除!', 'danger')
            } else {
                let src = player.src
                player.src = ''
                player.src = src
            }
        }
        player.onclick = e => {
            if (player.paused) {
                player.play()
            } else {
                player.pause()
            }
        }
        this.player = player
        g_setting.onSetConfig({
            playback(v) {
                player.playbackRate = Number(v);
            }
        })

        if (getConfig('autoPlay')) {
            let last = getConfig('lastVideo')
            if (typeof(last) == 'object') self.video_load(last)
        }
    },

    video_loadVid(vid) {
        g_api.douyin_videoDetail(vid).then(data => this.video_load(data), () => toast('无法获取视频信息，可能已被删除', 'danger'))
    },

    video_next() {
        let next = getParent(g_video.target, 'data-vid').next()
        this.video_click(next)
    },

    video_prev() {
        let prev = getParent(g_video.target, 'data-vid').prev()
        this.video_click(prev)
    },

    // 触发dom视频点击事件
    video_click(dom) {
        if (dom.length) {
            // TODO 设置指定CLASS
            let ele = dom.find('[data-loadvideo]')
            if (ele.length) {
                ele[0].click()
            }
        }
    },

    video_getSaveTo(item) {
        let { desc, aid } = item
        // getFormatedTime(3) + 
        return getConfig('downloadPath') +  nodejs.files.safePath(desc.replaceAll("\n", ' ')) + '[' + aid + '].mp4'
    },

    setPlayback(add) {
        setConfig('playback', add == undefined ? 1 : this.player.playbackRate + add)
    },

    tryPlay() {
        if (this.paused) {
            this.player.play()
            delete this.paused
        }
    },

    tryPause() {
        this.paused = true
        this.player.pause()
    },

    video_load(opts) {
        let { uid, vid } = opts
        if (uid) { // 用户视频
            let data = g_foll.getVideo(uid, vid)
            data.lastView = new Date().getTime() // 记录最后打开时间
            g_foll.save(false)

            opts = Object.assign({
                user: Object.assign({uid}, g_foll.list[uid].user) // 补上uid信息...
            }, data)
        } else
        if (opts.user) { // 收藏的视频
            uid = opts.user.uid
        }

        g_plugin.callEvent('video_load', { opts }).then(() => {
            setConfig('lastVideo', opts)
            this.preview = opts
            let div = $('#tab_video').removeClass('hide').attr({
                'data-vid': opts.aid,
                // 'data-aid': opts.aid,
                'data-uid': uid,
            }).data('json', opts)

            let saveTo = this.video_getSaveTo(opts)
            let exists = nodejs.files.exists(saveTo)
            let btn = $('#video_download')
            exists && btn.prop('draggable', true).attr('data-file', saveTo)

            replaceClass(btn.find('.ti'), 'ti-', 'ti-' + (exists ? 'folder' : 'download'))
            this.player.src = exists ? 'file://' + encodeURI(saveTo.replaceAll('\\', '/')).replaceAll('#', '%23') : opts.video
            this.player.poster = exists ? '' : opts.poster
            this.player.playbackRate = Number(getConfig('playback', 1))
            this.range.updateOptions({
                range: {
                    'min': 0,
                    'max': parseInt(opts.duration / 1000),
                }
            });
            div.find('.ti-heart').next().html(numToStr(opts.like))
            div.find('.ti-message-circle').next().html(numToStr(opts.comment))
            div.find('.ti-share').next().html(numToStr(opts.share))
            div.find('.ti-clock').next().html(getTime(opts.duration / 1000, ':', ':', '', false, 0))
            div.find('[data-action="user_homepage"]').html(opts.user.name)
            div.find('img').prop({ title: opts.user.name, src: toURL(opts.user.icon) })
            div.find('.desc').html(opts.desc)
            div.find('.time').html(getFormatedTime(5, opts.time))
            div.find('.ti-star').toggleClass('text-warning', g_coll.exists(opts.aid))

            g_detailTabs.tabs.tab_ative('video')

            g_sidebar.toggle('right', true)
        })

    },

    event_wheel: function(e) {
        let i;
        // let now = new Date().getTime();
        // if(now >= g_cache.lastWheel){
        //     i = e.detailY;
        //     $('#slider_videos').flexslider(i > 0 ? 'prev' : 'next') 
        //     g_cache.lastWheel = now + 500;
        // }
    },
}
g_detailTabs.register('video', {
    index: 3,
    onTabChanged: ev => {
        g_video.tryPlay()
    },
    onTabHiden() {
        g_video.tryPause()
    },
    onVideoEvent: (type, { tab }) => {
        if (type == 'show') {
            // g_dweb.meta_get(g_videoTabs.getTabValue('data', tab).file)
        }
    },
    tab: {
        id: 'video',
        title: '<i class="ti ti-video fs-2"></i>',
        html: `
            <div class="h-full hide" id="tab_video">
                <div id="douyin_player" class="position-relative">
                    <div id="range_video" class="position-absolute bottom-0 start-0 w-full slider-styled slider-round slider-hide" ></div>
                    <p demo-slider="slider11"></p>
                    <video playsinline="" webkit-playsinline="" onmousewheel="g_video.event_wheel(event)" poster="" class="w-full" loop autoplay></video>
                </div>
                <div class="card mt-2">
                  <div class="card-header p-2">
                        <div class="row align-items-center">
                            <div class="col-3">
                                <img src="" class="rounded-circle mx-auto w-full" title="">
                            </div>
                            <div class="col text-truncate">
                              <a href="#" class=" d-block" data-action="user_homepage"></a>
                              <div class="d-block text-muted text-truncate mt-1">
                                  <div class="list-inline-item">
                                     <i class="ti ti-heart fs-2"></i><span></span>
                                  </div>
                                  <div class="list-inline-item">
                                     <i class="ti ti-message-circle fs-2"></i><span></span>
                                  </div>
                                  <div class="list-inline-item">
                                     <i class="ti ti-share fs-2"></i><span></span>
                                  </div>
                                 <div class="list-inline-item">
                                     <i class="ti ti-clock fs-2"></i><span></span>
                                  </div>
                              </div>
                            </div>
                         </div>
                         <div class="card-actions me-2">
                          <a href="#" class="btn">
                            <i class="ti ti-dots fs-2"></i>
                          </a>
                        </div>

                  </div>
                  <div class="card-body p-2">
                    <span class="desc text-muted overflow-y-auto d-block" style="max-height: 70px;"></span>
                    <div class="d-block text-muted text-end time"></div>
                    <div class="btn-list mt-2 justify-content-center scroll-x  flex-nowrap">
                        <a class="btn btn-pill btn-ghost-primary" data-action="video_download" title="下载" id="video_download">
                          <i class="ti ti-download fs-2"></i>
                        </a>
                        <a class="btn btn-pill btn-ghost-warning" data-action="video_copyLink" title="复制信息">
                          <i class="ti ti-link fs-2"></i>
                        </a>
                        <a class="btn btn-pill btn-ghost-info" data-action="video_chart" title="商品分析">
                          <i class="ti ti-chart-line fs-2"></i>
                        </a>
                         <a class="btn btn-pill btn-ghost-secondary" data-action="video_web" title="网页打开">
                          <i class="ti ti-world fs-2"></i>
                        </a>
                        <a class="btn btn-pill btn-ghost-warning" data-action="coll_toggle" title="收藏">
                          <i class="ti ti-star fs-2"></i>
                        </a>
                         <a class="btn btn-pill btn-ghost-info" data-action="video_prev" title="上一个视频">
                          <i class="ti ti-arrow-narrow-up fs-2"></i>
                        </a>
                         <a class="btn btn-pill btn-ghost-info" data-action="video_next" title="下一个视频">
                          <i class="ti ti-arrow-narrow-down fs-2"></i>
                        </a>
                    </div>
                  </div>
                </div>

            </div>

           `
    },
}, g_video)