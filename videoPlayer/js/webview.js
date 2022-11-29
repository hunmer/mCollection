var g_webview = {

    init() {
        const self = this
        g_action.registerAction({
            webview_show: dom => self.webview_load()
        })
    },

    webview_load(url, opts) {
        let path = nodejs.dir + '\\webview\\'
        if (!this.win) {
            let win = this.win = new nodejs.remote.BrowserWindow({
                width: 1168,
                height: 788,
                webPreferences: {
                    spellcheck: false,
                    webSecurity: false,
                    nodeIntegration: true,
                    webviewTag: true,
                    contextIsolation: false,
                    preload: path + 'preload.js',
                    partition: "persist:webview",
                }
            })
            win.on('closed', e => {
                delete this.win
            })

            win.webContents.on('dom-ready', () => {
                win.webContents.on('ipc-message', (e, t, {type, msg}) => {
                    if(t == 'method'){ // ipc_send()
                        console.log(msg)
                        switch(type){
                            case 'parseURL':
                                return g_episode.playlist_parseURL(msg.url)
                        }
                    }
                });
            });


            // win.webContents.openDevTools()
        }
        this.win.loadFile(path + 'index.html', { userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36 Edg/103.0.1264.71' })
    }
}

g_webview.init()