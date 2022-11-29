const { app, ipcRenderer, clipboard, shell } = require('electron');
const { getCurrentWindow, getCurrentWebContents } = require('@electron/remote');
const path = require('path')

const _webContent = getCurrentWebContents()
const win = getCurrentWindow()
win.webContents.on('did-attach-webview', (event, webContents) => {
    // 新窗口转为tab
    webContents.setWindowOpenHandler(function(data) {
        g_tabs.group_newTab(webContents.id, data.url);
        return {
            action: 'deny'
        }
    });
});

ipcRenderer.on('method', (event, args) => {
    doAction(args);
});
ipcRenderer.on('newTab', (event, args) => {
    console.log(args)
    g_tabs.group_newTab(args.id, args.url);
});
ipcRenderer.on('closeTab', (event, id) => {
    g_tabs.ids_remove(id)
});



window._dataPath = path.resolve(__dirname, '../../..')
window.nodejs = {
    files: require('../../file.js'),
    method: function(data) {
        console.log(data);
        var d = data.msg;
        switch (data.type) {
            case 'reload':
                location.reload()
                break;
            case 'toggleFullscreen':
                app.setFullScreen(!app.fullScreen);
                break;
            case 'devtool':
                if (_webContent.isDevToolsOpened()) {
                    _webContent.closeDevTools();
                } else {
                    _webContent.openDevTools();
                }
                break;
            default:
                ipcRenderer.send('method', data);
                break;
        }
    }
}