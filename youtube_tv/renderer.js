const { app, ipcRenderer, clipboard, shell } = require('electron');
const remote = require('@electron/remote');
const { getCurrentWindow, getCurrentWebContents, webContents, session } = remote
const files = require('../file.js')
const fs = require('fs')
const path = require('path')

const _webContent = getCurrentWebContents()
ipcRenderer.on('method', (event, args) => {
    doAction(args);
});
// 文件对话框 回调
ipcRenderer.on('fileDialog_revice', (event, arg) => {
    g_pp.call(arg.id, arg.paths);
});

ipcRenderer.on('exit', (event, args) => {
    send('exit');
});


function send(data, method = 'method'){
    if(typeof(data) != 'object') data = {type: data}
   ipcRenderer.send(method, data);
}

window._dataPath = path.resolve(__dirname, '../../..')
window.nodejs = {
    remote,
    dir: __dirname,
    require,
    fs,
    path,
    files,
    kill: require('tree-kill'),
    cli: require('../cli.js'),
    request: require('request'),
    tempPath: files.getAppData() + '\\youtube_tv\\',
    method: function(data) {
        console.log(data);
        var d = data.msg;
        switch (data.type) {
            case 'url':
                shell.openExternal(d);
                break;
            case 'reload':
                location.reload()
                break;
            case 'copy':
                clipboard.writeText(d)
                g_toast && g_toast.toast('复制成功', 'success')
                break;
            case 'toggleFullscreen':
                app.setFullScreen(!app.fullScreen);
                break;
            case 'openFolder':
                shell.showItemInFolder(d)
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