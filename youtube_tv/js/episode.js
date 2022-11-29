var g_episode = {
    init() {
        const self = this
        self.dataPath = getConfig('dataPath') + 'datas\\'
        self.tip = $(`
            <div class="position-fixed border rounded-3 text-light hide" style="background-color: rgba(0, 0, 0, .5)">
            </div>
        `).appendTo('body')
        
        $(document)
            .on('click', '.sb', function(e) {
                let {vid } = this.dataset
                if(vid != g_episode.currentVid){
                    self.video_loadID(vid)
                }else{
                    self.getPlayer().setCurrentTime( self.lastTime)
                }
            })
            .on('mousemove', '.sb', function(e) { // 显示当前位置时间
                e = e.originalEvent
                let { width, height } = this
                let { rows, cols, duration, start, tip, title } = this.dataset
                let { offsetX, offsetY, x, y } = e
                let row = Math.ceil(offsetX / width / (1 / rows));
                let col = Math.ceil(offsetY / height / (1 / cols));
                if (row > 0 && col > 0) {
                    let time = start * 1 + (row - 1 + (col - 1) * rows) / (rows * cols) * duration
                    self.lastTime = time
                    self.tip.css({
                        left: x + 10,
                        top: y + 10
                    }).html(tip.replace('{time}', getTime(time)).replace('{title}', title)).toggleClass('hide', false)
                }
            })
            .on('mouseout', '.sb', function(e) {
                self.tip.toggleClass('hide', true);
            })
        // TODO 滚动的时候更新时间
        //  .on('mousewheel', '.sb', function(e) {
        //      $(this).triggerHandler('mousemove')
        // })

        g_cache.sbWidth = 100
        $('#episode_sb').on('scroll', function(e) {
            let scrollTop = this.scrollTop;
            if (scrollTop == 0) {
                return;
            }
            if (scrollTop + this.offsetHeight >= this.scrollHeight) {
                // g_pp.setTimeout('nextPage', () => g_datalist.page_nextPage(), 200)
            }
        }).on('mousewheel', function(e) {
            e = e.originalEvent
            if (e.ctrlKey) {
                let i = g_cache.sbWidth += e.deltaY < 0 ? 5 : -5
                if(i < 20) g_cache.sbWidth = 20
                if(i > 100) g_cache.sbWidth = 100
                $('.sb').attr('style', `width:${g_cache.sbWidth }% !important`);
            }
        })

        g_menu.registerMenu({
            name: 'episode_item',
            selector: '#episode_accordion .list-group-item[data-vid]',
            dataKey: 'data-vid',
            html: g_menu.buildItems([{
                icon: 'world',
                text: '打开网页',
                action: 'episode_item_web'
            }])
        });

        g_action.registerAction(['episode_item_web'], (dom, action) => {
            let vid = g_menu.key
            let [id, host] = vid.split('||')
            switch (action[0]) {
                case 'episode_item_web':
                    self.openHomepage(vid)
                    break
            }
        })

        g_action.registerAction({
            parseUrl: () => self.modal_parseUrl(),
            episode_click: dom => {
                let vid = $(dom).parents('[data-vid]').data('vid')
                let sb = getEle({vid}, '.sb').get(0)
                if(sb){
                    sb.parentElement.scrollTo(0, sb.offsetTop)
                }
                self.video_loadID($(dom).parents('[data-vid]').data('vid'))
            },
            video_openURL: () => self.openHomepage(g_episode.currentVid),
            video_reload: () => {
                getEle('video_reload', 'button').addClass('btn-loading')
                g_videoDatas.getCurrentData().loadURL(true)
            },
            episode_covers: dom => { // 切换所有封面
                $('#episode_sb').html('')
                if ($(dom).toggleClass('text-primary').hasClass('text-primary')) {
                    for (let [vid, data] of Object.entries(g_episode.currenData.videos)) {
                        $('#episode_sb').append(
                            g_videoDatas.parseStoryBoard(data.formats.find(format => format.format_id == 'sb0'), data.id+'||'+data.extractor, data.fulltitle)
                        )
                    }
                } else {
                    g_videoDatas.getCurrentData().loadStoryBoard()
                }
            },
            playlist_all: () => {
                nodejs.files.dirFiles(getConfig('dataPath'), ['json'], files => {
                    let list = files.map(file => getFileName(file, false))
                    g_form.confirm('selectPlaylist', {
                        elements: {
                            playlist: {
                                title: '播放列表',
                                type: 'select',
                                required: true,
                                list
                            }
                        },
                    }, {
                        id: 'selectPlaylist',
                        title: '选择播放列表',
                        onBtnClick: (btn, modal) => {
                            if (btn.id == 'btn_ok') {
                                let { playlist } = g_form.getVals('selectPlaylist')
                                self.playlist_parse(playlist)
                            }
                        }
                    })
                })
            }
        })
    },
    openHomepage(vid) {
        let [id, host] = vid.split('||')
        ipc_send('url', 'https://www.youtube.com/watch?v=' + id + '?t=' + this.getPlayer().getCurrentTime())
    },
    // 恢复最后的状态
    loadLast() {
        let playlist = getConfig('lastPlaylist')
        playlist && this.playlist_parse(playlist)
        let video = getConfig('lastVideo')
        video && this.video_loadID(video)
    },

    // 窗口添加解析URL
    modal_parseUrl(url) {
        g_form.confirm('form_parseUrl', {
            elements: {
                url: {
                    title: '网页地址',
                    type: 'textarea',
                    rows: 3,
                    required: true,
                    value: url || 'https://www.youtube.com/playlist?list=PLj61SPm9M9La9DiA_boNpgEE3VBw9Sqrk',
                    placeHolder: '支持油管视频与播放列表',
                },
            },
        }, {
            id: 'form_parseUrl',
            title: '解析视频',
            btn_ok: '解析',
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    // if(this.child)
                    let { url } = g_form.getVals('form_parseUrl')
                    this.playlist_parseURL(url)
                    toast('解析中...')
                }
            }
        })
    },

    // 停止解析
    playlist_parse_stop(callback) {
        if (this.child) {
            nodejs.kill(this.child.pid, 'SIGKILL', callback)
            delete this.child
        }
    },

    // 保存视频数据
    playlist_saveVideo(vid, data) {
        this.currenData.videos[vid] = data
        this.currentPlaylist != undefined && this.playlist_save(this.currentPlaylist, this.currenData)
    },

    // 保存播放列表
    playlist_save(key, data) {
        // TODO 显示保存的名字 或 读取已有的名称
        if (!key) {
            if (Object.keys(data.videos).length <= 1){
                //this.currentPlaylist = 'default' //  单个视频保存默认播放列表
                return this.playlist_parseJSON(data)
            }
            return g_form.confirm('form_playlist_save', {
                elements: {
                    title: {
                        title: '列表名称',
                        required: true,
                        value: data.playlist.title || '',
                    },
                },
            }, {
                id: 'form_playlist_save',
                title: '保存播放列表',
                btn_ok: '保存',
                onBtnClick: (btn, modal) => {
                    if (btn.id == 'btn_ok') {
                        let { title } = g_form.getVals('form_playlist_save')
                        this.playlist_save(title, data)
                    }
                }
            })
        }
        let { write, makeSureDir } = nodejs.files
        makeSureDir(this.dataPath)
        write(this.dataPath + key + '.json', JSON.stringify(data))
        this.playlist_parse(key)
    },

    // 获取播放列表保存目录
    playlist_getFile(key) {
        return this.dataPath + key + '.json'
    },

    // 获取播放列表JSON
    playlist_getJSON(key) {
        return nodejs.files.read(this.playlist_getFile(key))
    },

    // 获取播放列表
    playlist_get(key) {
        return JSON.parse(this.playlist_getJSON(key))
    },

    // 解析本地播放列表
    playlist_parse(id) {
        getEle('episode_covers').removeClass('text-primary')
        this.currentPlaylist = id
        setConfig('lastPlaylist', id)
        let json = this.playlist_get(id)
        if (json) {
            this.playlist_parseJSON(json)
        }
    },

    // 解析播放列表JSON
    playlist_parseJSON(data) {
        const self = this
        self.currenData = data

        let h = ''
        let i = 0
        for (let [id, item] of Object.entries(data.videos)) {
            let clip_cnt = g_clips.getClips(id, []).concat(item.clips || []).length
            h += `
                <div class="list-group-item" data-vid="${id}">
                  <div class="row align-items-center">
                    <div class="col-auto" data-action="episode_click">${++i}</div>
                    <div class="col-auto" data-action="episode_click">
                      <a href="#">
                        <span class="avatar" style="background-image: url(${item.thumbnail})"></span>
                      </a>
                    </div>
                    <div class="col text-truncate" data-action="episode_click">
                      <a href="#" class="text-reset d-block" title="${item.fulltitle}">${clip_cnt ? `<span class="badge bg-danger mr-2">${clip_cnt}</span>` : ''}${item.fulltitle}</a>
                      <div class="d-block text-muted text-truncate mt-n1" title="${item.description}">${item.description}</div>
                    </div>
                    <div class="col-auto">
                      <a href="#" class="list-group-item-actions">
                        <i class="ti ti-dots fs-2"></i>
                      </a>
                    </div>
                  </div>
                </div>`
        }

        $('#episode_accordion').html(h ? `<div class="list-group list-group-flush list-group-hoverable">
            ${h}
         </div>` : '')
        g_videoTabs.tabs.clear()

    },

    // 加载视频
    video_loadID(id) {
        const self = this
        this.currentVid = id
        setConfig('lastVideo', id)

        let inst = g_videoDatas.inst[id]
        if (!inst) {
            let data = this.currenData.videos[id]
            inst = new videoData(id, data, {
                file: self.playlist_getFile(this.currentPlaylist),
            })
        }
        inst.load()
    },

    // 获取VIDEO对象
    video_getObj(tab) {
        if (isEmpty(tab)) tab = g_videoTabs.tabs.currentTab
        return g_videoTabs.tabs.getContent(tab).find('video')[0]
    },

    // 设置状态文本
    setStatus(msg, status = 'cyan') {
        $(replaceClass($('#episode_header').find('.status'), 'status-', 'status-' + status)).find('.status-dot').toggleClass('status-dot-animated', status == 'cyan').next().html(msg)
    },

    // 解析播放列表URL
    playlist_parseURL(url, key) {
        const { setStatus } = this
        setStatus('解析中...')
        let r = {
            videos: {

            },
        } // TODO 添加模式?
        this.playlist_parse_stop()
        this.child = nodejs.cli.run(nodejs.path.resolve(__dirname, '..\\bin\\yt-dlp.exe'), `-j "${url}"`, {
            env: getProxy(),
        }, {
            onOutput: function(msg) {
                try {
                    // requested_formats
                    let data = JSON.parse(msg)
                    if (!r.playlist) {
                        r.playlist = {
                            title: data.playlist,
                            id: data.playlist_id,
                        }
                    }
                    setStatus(data.playlist_index + '/' + data.playlist_count)
                    let item = getObjVals(data, ['categories', 'channel', 'channel_id', 'description', 'duration', 'fulltitle', 'width', 'height', 'tags', 'thumbnail', 'formats', 'id', 'extractor', '_type', 'webpage_url'])
                    item.id
                    item.formats = item.formats.map(format => {
                        return {
                            audio: format.acodec,
                            video: format.vcodec,
                            size: format.filesize,
                            format_id: format.format_id,
                            format_note: format.format_note,
                            fragments: format.fragments,
                            rows: format.rows,
                            columns: format.columns,
                        }
                    })
                    r.videos[item.id + '||' + item.extractor] = item
                } catch (err) {
                    console.log(err)
                }
            },
            onExit: () => {
                setStatus('解析完成', 'green')
                if (Object.keys(r.videos).length > 0) this.playlist_save(key, r)
            }
        })
    },

    // 获取右侧VID元素
    getListElement(vid = '', selector = '') {
        return getEle({ vid }, '.list-group-item' + selector)
    },

    // 获取Player对象
    getPlayer(key) {
        let player = g_episode.video_getObj(key)
        return {
            setCurrentTime(time, play = true) {
                player.currentTime = time
                play && player.play()
            },
            getURL() {
                return player.src
            },
            pause(paused) {
                if (paused == undefined) paused = !player.paused
                if (paused) {
                    player.pause()
                } else {
                    player.play()
                }
            },
            getCurrentTime() {
                return player.currentTime
            },
            tryPause() {
                if(player){
                    g_cache.lastPlaying = !player.paused
                player.pause()
                }
                
            },
            tryPlay() {
                if (g_cache.lastPlaying) {
                    delete g_cache.lastPlaying
                    player && player.play()
                }
            },
        }
    }

}
g_episode.init()