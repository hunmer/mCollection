var g_videoTabs = {
    init() {


        g_tabs.init({
            saveData: (name, data) => false && local_saveJson('tabs_' + name, data),
            getData: name => local_readJson('tabs_' + name, {}),
        })

        this.tabs = g_tabs.register('video_tabs', {
            target: '#video_tabs',
            parseContent: (k, v) => {
                return `
                <div class="datalist h-full">
                    <div id="player" class="w-full h-full p-2 pt-0">
                        <video src="${v.data.file}" poster="" class="w-full h-full"></video>
                    </div>
                </div>
                `
            },
            // parseTab: (k, v) => v.title,
            onShow: tab => {
                g_clipTabs.videoTabEvent('show', tab)
            },
            onHide: tab => {
            },
            onClose: tab => {
                g_clipTabs.videoTabEvent('close', tab)
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
    },


    // 新建视窗
    tab_new(data) {
        // getConfig('oneTab') && this.tabs.clear()
        this.tabs.try_add(function(v) { // 不重复打开
            return v[1].data.file == data.file
        }, {
            title: data.title,
            data: {
                file: data.file
            },
        })
    },

}

g_videoTabs.init()