const { app, BrowserWindow, ipcMain, Menu, shell, dialog, session } = require('electron')
const path = require('path')
const http = require('http')
const files = require('./file.js')
app.commandLine.appendSwitch("disable-http-cache");
app.disableHardwareAcceleration()
Menu.setApplicationMenu(null)
const remote = require("@electron/remote/main")
var mode
var homepage
var win;
var _basePath = path.dirname(process.execPath)

const send = (k, v) => win.webContents && win.webContents.send(k, v);

const ProgressBar = require('electron-progressbar');

function openFileDialog(opts, callback) {
    opts = Object.assign({
        title: '选中文件',
        // filters: [{
        //     name: '视频文件',
        //     extensions: ['mp4', 'ts', 'm3u8', 'flv', 'mdp', 'mkv'],
        // }],
        properties: ['openFile'], // multiSelections
    }, opts);
    dialog.showOpenDialog(win, Object.assign({}, opts)).then(res => callback(res.filePaths || res.filePath));
}

ipcMain.on("method", async function(event, data) {
    let d = data.msg;
    switch (data.type) {
        case 'exit':
            return app.exit()
        case 'ondragstart':
            // TODO 判断是否为云盘，云盘的文件加载封面会报错就很奇怪...难道要异步保存到本地再startDrag??
            let list = [];
            for (let file of d.files) {
                if (files.exists(file)) list.push(file);
            }
            event.sender.startDrag({
                files: list,
                // icon: d.icon || __dirname + '/files.ico', 
                icon: __dirname + '/files.ico',
            });
            break;
        case 'pin':
            if (d == undefined) d = !win.isAlwaysOnTop();
            win.setAlwaysOnTop(d, 'screen');
            break;
        case 'min':
            return win.minimize()
        case 'max':
            return win.isMaximized() ? win.restore() : win.maximize()
        case 'close':
            return win.close()

        case 'progress':
            return win.setProgressBar(d.val, d.type || 'normal')
        case 'fileDialog':
            openFileDialog(d, res => {
                event.sender.send('fileDialog_revice', {
                    id: d.id,
                    paths: res
                })
            });
            break;
    }
});
// app.isPackaged

function createWindow() {
    win = new BrowserWindow({
        // width: 600,
        // height: 800,
        // minHeight: 600,
        // minWidth: 800,
        show: false,
        shadow: true,
        frame: false,
        webPreferences: {
            spellcheck: false,
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            webviewTag: true,
            contextIsolation: false,
        }
    })

    // remote.enable(win.webContents);
    win.setThumbarButtons([{
        tooltip: 'button1',
        icon: path.join(__dirname, 'test.png'),
        click() { console.log('button1 clicked') }
    }])
    win.setOverlayIcon(path.join(__dirname, 'test.png'), 'Description for overlay')
    win.webContents.on('did-attach-webview', (event, webContents) => {
        remote.enable(webContents);
        // 新窗口转为tab
        webContents.session.setProxy({}) // 重置代理
        webContents.setWindowOpenHandler(function(data) {
            webContents.send('newTab', {
                id: webContents.id,
                url: data.url
            });
            return {
                action: 'deny'
            }
        });
    });
    win.webContents.session.on('will-download', (e, item, webContents) => {
        e.preventDefault();
        send('download', {
            refer: webContents.getURL(),
            url: item.getURL(),
            type: item.getMimeType(),
            fileName: item.getFilename(),
            size: item.getTotalBytes(),
            webview: webContents.id
        })
    });

    win.on('always-on-top-changed', (event, isTop) => {
        send('togglePin', isTop)
    });

    win.on('close', (event) => {
        event.preventDefault(true)
        dialog.showMessageBox(win, {
            message: ' 确定退出吗?',
            type: 'question',
            title: '提示',
            buttons: ['确定', '取消']
        }).then(r => {
            if (r.response == 0) {
                send('exit')
                // app.exit()
            }
        })
    })


    win.maximize()
    win.loadFile(homepage, { userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36 Edg/103.0.1264.71' })
    win.show();
}
app.whenReady().then(() => {
    let list = {
        videoPlayer: {
            title: '视频播放器',
            description: '',
            url: 'videoPlayer\\index.html',
            icon: _basePath + '\\resources\\app\\videoPlayer\\favicon.ico',
            dataPath: _basePath + '\\cache\\videoPlayer\\',
        },
        videoManager: {
            title: '视频裁剪',
            description: '',
            url: 'videoManager\\index.html',
            icon: _basePath + '\\resources\\app\\cut.ico',
            dataPath: _basePath + '\\cache\\videoManager\\',
        },
        onlineCut: {
            title: '在线裁剪',
            description: '',
            url: 'youtube_tv\\index.html',
            icon: _basePath + '\\resources\\app\\cut.ico',
            dataPath: _basePath + '\\cache\\cut\\',
        },
        main: {
            url: 'index.html',
            title: '数据库管理',
            dataPath: _basePath + '\\cache\\main\\',
        },
        dou: {
            title: '抖音协助',
            description: '',
            url: 'dou\\index.html',
            icon: _basePath + '\\resources\\app\\dou.ico',
            dataPath: _basePath + '\\cache\\dou\\',
        },
        update: {
            title: '检查更新',
        },
    }

    let tasks = []
    for (let [k, v] of Object.entries(list)) {
        if (v.icon) {
            tasks.push({
                program: process.execPath,
                arguments: k,
                iconPath: v.icon,
                iconIndex: 0,
                title: v.title,
                description: v.description
            })
        }

    }
    app.setUserTasks(tasks)

    let choose
    if (process.argv.length < 3) {
        let keys = Object.keys(list)
        let buttons = keys.map(k => list[k].title).concat('取消')
        choose = dialog.showMessageBoxSync({
            type: 'question',
            buttons,
            defaultId: 0,
            cancelId: buttons.length - 1,
            message: '选择打开程序',
            title: '启动',
            // checkboxLabel: 'remember',
            // checkboxChecked: true,
        })
        if (!keys[choose]) return app.exit()
        setHomepage(list[keys[choose]])
    } else {
        setHomepage(list[process.argv[2]])
    }
})

function setHomepage(data) {
    if(data.title == '检查更新'){
        return;
    }
    app.setPath('userData', data.dataPath);
    homepage = data.url
    remote.initialize()
    createWindow()
    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
}

// 自动开启新窗口的remote模块
app.on('browser-window-created', (_, window) => {
    require("@electron/remote/main").enable(window.webContents)
})


// 关闭窗口
// ipcMain.handle("closeWindow", (e, id) => {
//   console.log(id);
//   const target = webContents.fromId(id);
//   target.destroy();
//   let win = BrowserWindow.fromWebContents(e.sender);
//   win.close();
// });

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
})