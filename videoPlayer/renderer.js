const { app, ipcRenderer, clipboard, shell } = require('electron');
const remote = require('@electron/remote');
const { getCurrentWindow, getCurrentWebContents, webContents, session, BrowserWindow } = remote
const files = require('../file.js')
const fs = require('fs-extra')
const path = require('path')

const _app = getCurrentWebContents()
const _webContent = getCurrentWebContents()
ipcRenderer.on('method', (event, args) => {
    doAction(args);
});
// 文件对话框 回调
// TODO 把fileDialog_revice取消
ipcRenderer.on('fileDialog_revice', (event, arg) => {
    g_pp.call(arg.id, arg.paths);
});

ipcRenderer.on('callback', (event, arg) => {
    if (arg.type == 'zip_complete') {
        let { size, saveTo } = arg
        toast(`[${renderSize(size)}]保存成功 <b><a data-action="openFile" data-file="${saveTo}" href="#">${getFileName(saveTo)}</a></b>`, 'success')
    }
    // g_pp.call.apply(arg);
});

ipcRenderer.on('exit', (event, args) => {
    g_downloader.aria2c.exit()
    send('exit');
});

function send(data, method = 'method') {
    if (typeof(data) != 'object') data = { type: data }
    ipcRenderer.send(method, data);
}

window._dataPath = path.resolve(__dirname, '../../..')
window.nodejs = {
    remote,
    _app,
    app,
    _webContent,
    session,
    dir: __dirname,
    require,
    fs,
    path,
    files,
    os: require('os'),
    kill: require('tree-kill'),
    cli: require('../cli.js'),
    clipboard,
    bin: path.resolve(__dirname, '../bin'),
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

window.addEventListener('unload', function(e) {
    closeWindows();
    doAction('download_stopAll')
});

function closeWindows() {
    g_rule.ids = {}
    for (var win of BrowserWindow.getAllWindows()) {
        if (win.id != 1) {
            win.close();
        }
    }
}

function getBrowserWindowFromWebContents(webContents) {
    const allWindows = BrowserWindow.getAllWindows();
    let result = allWindows.find((win) => win.webContents === webContents);

    if (!result) {
        result = allWindows.find((win) => {
            return win.getBrowserViews().some(
                (view) => view.webContents === webContents
            );
        });
    }

    return result || null;
}


function notifiMsg(title, opts) {
    let obj = new Notification(title, {
        body: opts.text || '',
        icon: opts.icon || './favicon.png',
        silent: opts.slient,
    });
    obj.onclick = function(e) {
        opts.onclick && opts.onclick(e);
    }
    obj.onclose = function(e) {
        opts.onclose && opts.onclose(e);
    }
    obj.onshow = function(e) {
        opts.onshow && opts.onshow(e);
    }
    return obj;
}

function showMessage(title, text) {
    notifiMsg(title, {
        text,
        onclick(){
            ipc_send('show');
        }
    });
}
