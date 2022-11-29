let g_dweb = {
    cache: {},
    init() {
        const self = this
        g_action.registerAction({
            
        })
    },

}
g_detailTabs.register('webview', {
    index: 3,
    onTabChanged: old => {

    },
    onVideoEvent: (type, { tab }) => {
        if (type == 'show') {
            // g_dweb.meta_get(g_videoTabs.getTabValue('data', tab).file)
        }
    },
    // https://m.douyin.com/share/video/6829512736372804878
    // https://www.chanmama.com/login
    tab: {
        id: 'webview',
        title: '<i class="ti ti-world fs-2"></i>',
        html: `
            <div class="overflow-y-auto h-full" id="tab_webview">
                <webview src="" useragent="Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36 Edg/107.0.1418.26" class="w-full h-full" contextIsolation="false" allowpopups disablewebsecurity nodeintegration spellcheck="false"></webview>
            </div>
            `
    },
}, g_dweb)