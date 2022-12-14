const { app, ipcRenderer, clipboard, shell } = require('electron');
const remote = require('@electron/remote');
const { getCurrentWindow, getCurrentWebContents, webContents, session, net } = remote
const files = require('../file.js')
const fs = require('fs-extra')
const path = require('path')
const _webContent = getCurrentWebContents()
const win = getCurrentWindow()

win.webContents.on('did-attach-webview', (event, webContents) => {
    // 新窗口转为tab
    webContents.setWindowOpenHandler(function(data) {
        g_browser.group_newTab(webContents.id, data.url);
        return {
            action: 'deny'
        }
    });
});

ipcRenderer.on('method', (event, args) => {
    doAction(args);
});

ipcRenderer.on('log', (event, args) => {
    console.log(args)
});

ipcRenderer.on('newTab', (event, args) => {
    g_browser.group_newTab(args.id, args.url);
});

ipcRenderer.on('closeTab', (event, id) => {
    g_browser.ids_remove(id)
});

// 文件对话框 回调
ipcRenderer.on('fileDialog_revice', (event, arg) => {
    g_pp.call(arg.id, arg.paths);
});

ipcRenderer.on('exit', (event, args) => {
    send('exit');
});


function send(data, method = 'method') {
    if (typeof(data) != 'object') data = { type: data }
    ipcRenderer.send(method, data);
}

window._dataPath = path.resolve(__dirname, '../../..')
window.nodejs = {
    remote,
    dir: __dirname,
    require,
    request: require('request'),
    webContents,
    fs,
    net,
    os: require('os'),
    path,
    files,
    clipboard,
    cli: require('../cli.js'),
    method: function(data) {
        console.log(data);
        let d = data.msg;
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
            case 'openFile':
                nodejs.files.openFile(d)
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

function downloadFile(opts) {
    let received_bytes = 0;
    let total_bytes = 0;
    let progress = 0;
    let req = nodejs.request(Object.assign({
        method: 'GET',
        url: opts.url,
        timeout: 15000,
        onProgress: i => {},
        onComplete: () => {},
        onError: () => {},
        // proxy: 'http://127.0.0.1:1080',
    }, opts.opts || {}))

    let fileBuff = [];
    req.on('data', function(chunk) {
        received_bytes += chunk.length;
        fileBuff.push(Buffer.from(chunk));
        let newProgress = parseInt(received_bytes / total_bytes * 100);
        if (newProgress != progress) {
            progress = newProgress;
            opts.onProgress(progress);
        }
    });
    req.on('end', function() {
        let totalBuff = Buffer.concat(fileBuff);
        files.makeSureDir(opts.saveTo)
        if (opts.saveTo) {
            fs.writeFile(opts.saveTo, totalBuff, (err) => {
                opts.onComplete(opts.saveTo, opts.url)
            });
        } else {
            opts.onComplete(totalBuff.toString())
        }
    });
    req.on('response', function(data) {
        total_bytes = parseInt(data.headers['content-length']);
    });
    req.on('error', function(e) {
        opts.onError(e.toString());
    });
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

