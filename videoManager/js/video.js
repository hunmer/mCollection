var g_video = {
    init() {
    	const self = this
        g_action.registerAction({
            video_loadVideo: dom => {
                self.loadVideo(dom.dataset.md5)
            }
        })
    },

    async loadVideo(md5) {
        let d = await g_data.data_get(md5)
        g_videoTabs.tab_new({
            file: d.file, title: getFileName(d.file),
        })
    },

}

g_video.init()