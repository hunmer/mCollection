var g_videoTabs = {
    init() {

        this.tabs = g_tabs.register('video_tabs', {
            target: '#video_tabs',
            saveData: false,
            parseContent: (k, v) => {
                let preload = isEmpty(v.data.file)
                return `
                <div class="datalist h-full position-relative">
                    ${preload ? `
                    <button class="btn btn-primary btn-pill position-absolute bottom-10 end-10 zIndex-top" data-action="video_reload"><i class="ti ti-player-play fs-2 mr-2"></i>加载视频</button>
                    ` : ''}
                    <div class=" player w-full h-full">
                        <video poster=${v.data.poster} src="${v.data.file}" class="w-full h-full" ${preload ? '' : 'autoplay controls'}></video>
                    </div>
                </div>
                `
            },
            // parseTab: (k, v) => v.title,
            onShow: tab => {},
            onShown: tab => {
                let vid = g_videoTabs.getTabValue('value', tab)
                g_episode.getListElement('', '.active').removeClass('active')
                g_episode.getListElement(vid).addClass('active')

                g_videoTabs.tabs.tab_tabs().forEach(tab => {
                    g_episode.getPlayer(tab).pause()
                })

                g_detailTabs.videoTabEvent('show', { tab })
            },
            onHide: tab => {},
            onClose: tab => {
                g_detailTabs.videoTabEvent('close', { tab })
            },
        })
        // g_videoTabs.tab_new({
        //     file: 'res/1.mp4',
        //     title: '文件1',
        // })
        // g_videoTabs.tab_new({
        //     file: 'res/2.mp4',
        //     title: '文件2',
        // })

        $(document).
        on('mousewheel', '.player', function(e) {
            if (!$('input:focus').length) {
                e = e.originalEvent
                let key = g_hotkey.getInputCode(e, 'key')
                if (key == '') return;
                let video = g_episode.video_getObj()
                let duration = video.duration
                if (!isNaN(duration)) {
                    let add = 1 // eval(opts[key]) || 
                    if (add < 1) add = 1;
                    video.currentTime += e.deltaY > 0 ? 0 - add : add;
                    clearEventBubble(e);
                }
            }
        })
    },

    // 获取tab属性
    getTabValue(key, tab) {
        return g_videoTabs.tabs.tab_getValue(tab)[key]
    },


    // 新建视窗
    tab_new(data) {
        // getConfig('oneTab') && this.tabs.clear()
        return this.tabs.try_add(function(v) { // 不重复打开
            return v[1].value == data.value
        }, {
            title: data.title,
            value: data.value,
            data: data.data
        })
    },

}

g_videoTabs.init()