var g_player = {

    init() {
        const self = this
        loadRes(['js/dplayer/DPlayer.min.js', 'js/dplayer/hls.min.js'], () => {
            
        })

        let getBtn = () => g_playlist.playlist_getItem(g_videoTabs.tabs.tab_getValue().url)
        g_action.registerAction({
            playPrev(){
                getBtn().prev().click()
            },
            playNext(){
                getBtn().next().click()
            }
        })
    },

    newPlayer(tab, container, video, onLoaded, onError) {
        let config = {
            hotkey: true,
            autoplay: true,
            volume: 1,
            container,
            screenshot: true,
            video,
            pluginOptions: {
                flv: {
                    // refer to https://github.com/bilibili/flv.js/blob/master/docs/api.md#flvjscreateplayer
                    mediaDataSource: {
                        // mediaDataSource config
                    },
                    config: {
                        lazyLoad: false,
                    },
                },
            },
            contextmenu: [{
                    text: '上一集',
                    click(){
                        doAction('playPrev');
                    },
                }, {
                    text: '下一集',
                    click(){
                        doAction('playNext');
                    },
                },
                /*{
                    text: '生成进度条预览图',
                    click: player => {
                        doAction('videoThumb');
                    },
                },*/
                {
                    text: '关闭文件',
                    click(){
                        g_videoTabs.tabs.tab_remove()
                    },
                },
            ],
        }

        let player = new DPlayer(config)
        player.on('loadeddata', function(e) {
            onLoaded && onLoaded(e)
        });
        player.on('error', function(e) {
            onError && onError(e)
        });
        this.players[tab] = player
        return player
    },

    players:{},

    getPlayer(tab) {
        if(!tab) tab = g_videoTabs.tabs.currentTab
        let player = this.players[tab]
        let video = player.video
        return {
            video,
            player,
            setCurrentTime(time, play = true) {
                video.currentTime = time
                play && video.play()
            },
            getURL(realURL = false) {
                if(realURL && !video.src.startsWith('file:')){
                    return new Promise(reslove => g_rule.url_parse(g_videoTabs.getTabValue('url', tab), reslove))
                }
                return player.options.video.url
            },
            pause(paused) {
                if (paused == undefined) paused = !video.paused
                if (paused) {
                    video.pause()
                } else {
                    video.play()
                }
            },
            getCurrentTime() {
                return video.currentTime
            },
            tryPause() {
                if (video) {
                    g_cache.lastPlaying = !video.paused
                    video.pause()
                }

            },
            tryPlay() {
                if (g_cache.lastPlaying) {
                    delete g_cache.lastPlaying
                    video && video.play()
                }
            },
        }
    }

}

g_player.init()