var g_videoTabs = {
    init() {

        g_action.registerAction({
            // 加载视频
            video_reload(dom) {
                dom = $(dom).addClass('btn-loading')
                let par = dom.parents('.datalist')
                let tab = getParentAttr(dom, 'data-content')
                let url = par.data('src')

                // setConfig('player_lastURL', url)
                let player = g_player.newPlayer(tab, par.find('.player')[0], {
                    url,
                }, e => {
                    dom.addClass('hide')
                }, e => {
                    dom.removeClass('btn-loading')
                    console.error(e)
                })
            }
        })

        this.tabs = g_tabs.register('video_tabs', {
            target: '#video_tabs',
            saveData: false,
            parseContent: (k, v) => {
                return `
                <div class="datalist h-full position-relative" data-src="${v.value}">
                    <button class="btn btn-primary btn-pill position-absolute bottom-10 end-10 zIndex-top" data-action="video_reload"><i class="ti ti-player-play fs-2 mr-2"></i>加载视频</button>
                    <div class="player w-full h-full" style="background-image: url(${v.poster || ''})">
                    </div>
                </div>
                `
            },
            // parseTab: (k, v) => v.title,
            onShow: tab => {},
            onShown: tab => {
                // let vid = g_videoTabs.getTabValue('value', tab)
                // g_episode.getListElement('', '.active').removeClass('active')
                // g_episode.getListElement(vid).addClass('active')

                // g_videoTabs.tabs.tab_tabs().forEach(tab => {
                //     g_episode.getPlayer(tab).pause()
                // })

                g_detailTabs.videoTabEvent('show', { tab })
            },
            onHide: tab => {},
            onClose: tab => {
                g_detailTabs.videoTabEvent('close', { tab })
            },
        })
        // g_videoTabs.tab_new({
        //     value: 'https://rongxingvr11.rx9696mv.com:8866/cz8l8TxArUUqg47LbCTIakZ2ALNeMq11ApJQKhMiy0mCaJA5YX2Ld9ViBJLNMnE_DS_mcfHA7TMn6I5hg2Mr6Q/RongXingVR.m3u8',
        //     title: '文件1',
        // })

    },

    // 根据文件关闭tab
    closeByFile(file) {
        let tab = this.tabs.tab_findTab(file)
        if (tab) {
            this.tabs.tab_remove(tab)
        }
    },

    // 获取tab属性
    getTabValue(key, tab) {
        let d = g_videoTabs.tabs.tab_getValue(tab)
        if(d != undefined){
            return d[key]
        }
    },


    // 新建视窗
    tab_new(opts) {
        /*getConfig('oneTab') && */
        this.tabs.clear()
        return this.tabs.try_add(function(v) { // 不重复打开
            return v[1].value == opts.value
        }, opts)
    },

}

g_videoTabs.init()