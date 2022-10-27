var g_cache = {
    imgs: {},
    reqs: {}
}
var os = require('os');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const images = require("images");
var handle = require('./handle.js');
var port = 41596;

function sendMsg(client, msg) {
    if (typeof(msg) == 'object') msg = JSON.stringify(msg);
    client.send(msg);
}

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 41595 });
wss.on('connection', function connection(ws) {
    //sendMsg(ws, {type: 'msg', msg: 'welcome'});
    ws.on('message', function incoming(msg) {
        var data = JSON.parse(msg);
        console.log(data);
        switch (data.type) {
            case 'scanFiles':
                // 保存拖动到浏览器的文件
                handle.getTargetFiles(data.files, ws);
                break;
            case 'checkUpdate':
                handle.checkUpdate(data.url, ws);
                break;
            case 'updateFiles':
                handle.updateFiles(data.url, data.files, ws);
                break;
            case 'checkFiles':
                handle.checkFolderUpdate(data.resPath, data.paths, ws);
                break;
            case 'downloadImages':
                break;
            case 'listRecent':
                var key = data.key;
                if (g_cache.reqs[key]) {
                    echoJson(g_cache.reqs[key], data.data);
                    delete g_cache.reqs[key];
                }
                break;
        }
    })
});

function broadcastMsg(msg) {
    if (typeof(msg) == 'object') msg = JSON.stringify(msg);
    wss.clients.forEach(function each(client) {
        client.send(msg);
    });
}

console.log('Websocket running at ws://' + ip + ':41595');

const express = require('express');
const { exit } = require('process');
const app = express();
// TODO 其他目录？
app.use(express.static(__dirname));

// const logger = (req, res, next) => {
//   console.log(
//     `请求的ip地址是：${req.ip}, 请求的路径是：${
//       req.url
//     }`);
//   console.log(req);
//   next();
// };
// app.use(logger);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

function registerApi(url, type, callback) {
    app[type](url, callback);
}

function echoJson(res, data) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

/*
/
api/application/info
api/folder/listRecent
(x)api/preferences/collect/on
(x)api/preferences/collect/off
*/

// 获取服务器IP
registerApi('/getServerIp', 'get', (req, res) => {
    echoJson(res, { ip: getServerIp() });
});

// 保存
registerApi('/get', 'get', (req, res) => {
    var key = req.query.key;
    if (key && g_cache.imgs[key]) {
        echoJson(res, g_cache.imgs[key]);
        delete g_cache.imgs[key];
    } else {
        echoJson(res, { type: 'msg', data: '没有找到资源!' });
    }
});

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return dirname;
    }
    if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return dirname;
    }
}

registerApi('/api/item/addFromURLs', 'post', (req, res) => {
    // items   由多个 item 组成的 array 物件（参考下方说明）
    // folderId    如果带有此参数，图片将会添加到指定文件夹

    // url 必填，欲添加图片链接，支持 http、 https、 base64
    // name    必填，欲添加图片名
    // website 图片来源网址
    // annotation  图片注释
    // tags    图片标签
    // modificationTime    图片创建时间，可以用此参数控制添加后在 Eagle 的排列顺序
    // headers 选填，自定义 HTTP headers 属性，可用来绕过特定网站保护机制
    echoJson(res, {
        "status": "success"
    });
    saveImages(req.body);

})

function broadcastData(data) {
    var key = new Date().getTime();
    g_cache.imgs[key] = data;
    broadcastMsg({ type: 'data', url: getServerIp() + '/get?key=' + key });
}

function getServerIp() {
    return 'http://' + ip + ':' + port;
}

// 解析来自http的数据
function saveImages(data) {
    var lists = data.items || [data];

    for (var d of lists) {
        if (!d.src) continue;
        if (d.src.startsWith('data:image/')) {
            // base64转图片
            var bin = new Buffer.from(d.src.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            var md5 = crypto.createHash("md5WithRSAEncryption").update(bin.toString("binary")).digest("hex");
            var file = mkdirsSync((isAndroid ? '/sdcard/savePics/' : 'F:/AppServ/www/PicManager/savePics/') + md5.substr(0, 1) + '/') + md5 + '.png';

            fs.writeFileSync(file, bin)
            d.src = 'png';
            d.md5 = md5;
            // 略缩图
            resizeImage(file);
        }
    }
    broadcastData(data);
}

function resizeImage(file) {
    if (isAndroid) {

        if (!fs.existsSync(file)) return;
        var image = images.readImageSync(file);
        var w = image.width;
        var cacheFile = path.dirname(file) + '/cache_' + path.basename(file);
        images.writeImageSync(image.resizeSync(200, parseInt(200 / w * image.height), 0), cacheFile, 50);
        if (fs.existsSync(cacheFile)) {
            fs.renameSync(cacheFile, file + '.thumb');
        }
    } else {
        images(file)
            .resize(200)
            .save(file + '.thumb', 'png', {
                quality: 50
            });
    }
}

// 最近使用文件夹 /api/folder/listRecent
// GET 取得最近用户使用过的文件夹列表
registerApi('/api/folder/listRecent', 'get', (req, res) => {
    var key = new Date().getTime();
    g_cache.reqs[key] = res;
    return broadcastMsg({ type: 'listRecent', key: key });
});

/* 适配eagle插件 */

// 应用版本信息 /api/application/info
// GET 取得当前运行 Eagle App 的详细信息，通常我们可以透过这个方式判断用户设备是否能够运行某些功能。

registerApi('/api/application/info', 'get', (req, res) => {
    var data = {
        "status": "success",
        "data": {
            "version": "1.11.0",
            "prereleaseVersion": null,
            "buildVersion": "20200612",
            "execPath": "/Users/augus/Projects/Eagle App/node_modules/electron/dist/Electron.app/Contents/Frameworks/Electron Helper (Renderer).app/Contents/MacOS/Electron Helper (Renderer)",
            "platform": "darwin"
        }
    };
    echoJson(res, data);
});

registerApi('/', 'post', (req, res) => {
    // version 2.5.1
    // type    image (save-url,screen capture,import-images)
    // title   www.baidu
    // url https://mbd.baidu.com/newspage/data/landingsuper?context=%7B%22nid%22%3A%22news_9993329904832847038%22%7D&n_type=-1&p_from=-1
    // src data:image/jpeg;base64,
    // folderID    （目录id或者空 choose=选择目录)
    // extendTags  
    // metaAlt 
    // metaTitle   www.baidu
    // metaDescription 全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。
    // metaTags    

    // forceHideCollectModal   true (收藏到目录)
    // images [{"type":"image","width":64,"height":64,"src":"http://127.0.0.1/PicManager/res/user.jpg","title":"user"},{"type":"image","width":1440,"height":1920,"src":"http://127.0.0.1/PicManager/res/1.jpg?t=1642853752862","title":"tag1,tag2"}] (import-images)
    var d = req.body;
    delete d.version & delete d.extendedTags & delete d.metaAlt & delete d.metaTitle & delete d.metaDescription & delete d.metaTags & delete d.forceHideCollectModal;
    var data = { "appVersion": "2.0.0", "preferences": { "showSubfolderContent": false, "useRetina": false, "language": "zh_CN", "general": { "language": "zh_CN", "showMenuItem": "true", "showSidebarBadge": "true", "autoSelect": "true", "showCollectModal": "false", "showCaptureCollectModal": "false", "IPTC": "false", "enableGPU": "true" }, "habits": { "dblclickSidebarItem": "collapse", "scrollBehavior": "paging", "videoScrollBehavior": "progress", "hoverZoom": "on", "renderBehavior": "non-pixelated", "defaultMode": "preview", "alwaysShowAnnotations": "hover", "transparency": "hide", "rememberLastZoom": "on", "defaultRatio": "auto", "keyspace": "preview", "middleBtn": "openNewWindow", "gifViewer": "off", "doubleclick": "internal", "scrollBehaviorTour": true }, "shortcuts": { "keybinds": { "show.eagle": "", "show.search": "", "zoom.in": "Ctrl + =", "zoom.out": "Ctrl + -", "zoom.actual": "Ctrl + 0", "zoom.fit": "Ctrl + 9", "capture.area": "Ctrl + Alt + E", "capture.window": "", "capture.full": "", "quicksearch": "Ctrl + J", "add.to": "Ctrl + Shift + J", "create.folder": "Ctrl + Shift + N", "create.smartFolder": "Ctrl + Shift + Alt + N", "import.pinterest": "Ctrl + Shift + Alt + P", "import.huaban": "Ctrl + Shift + Alt + H", "import.artstation": "Ctrl + Shift + Alt + S", "open.link": "Ctrl + Shift + O", "toggle.filter": "Ctrl+Shift+F", "open.tagfilter": "Ctrl+Shift+T", "switch.library": "Ctrl+L" } }, "theme": "GRAY", "download": { "queueLength": 5 }, "notification": { "soundEffect": { "enable": "true", "when": { "deleteImage": "true", "deleteFolder": "true", "screencapture": "true", "extension": "true" } }, "notification": { "when": { "screencapture": "true", "extension": "true", "repeatImage": "false", "autoImport": "true" } } }, "sidebar": { "untagged": "true", "unfiled": "true", "recent": "true", "random": "true", "quickAccess": "true", "smartFolder": "true", "folder": "true" }, "filter": { "color": "true", "tags": "true", "folders": "true", "shape": "true", "rating": "true", "type": "true", "date": "true", "mtime": "false", "resolution": "true", "fileSize": "false", "comments": "false", "annotation": "true", "url": "true", "camera": "false", "duration": "true", "bpm": "false", "fontActivated": "false" }, "screencapture": { "autoTagging": { "enable": "true" }, "autoWriteClipboard": "false", "useRetina": "true", "shortcutsEnable": "true", "format": "png" }, "video": { "hoverPlay": "true", "zoomFill": "false", "autoPlay": "true", "rememberPosition": "true", "loopShortVideo": "true" }, "font": { "autoTag": "true" }, "proxy": { "enable": "false", "ip": "127.0.0.1", "port": 1087 }, "privacy": { "enable": "false", "password": "", "passwordTips": "" }, "autoImport": { "enable": "false", "path": "" } }, "showCollectModal": false }

    if (['screen capture', 'import-images', 'image'].indexOf(d.type) != -1) {
        saveImages(d);
    }
    echoJson(res, data);

});

app.listen(port);
console.log('HTTPServer running at http://' + ip + ':' + port + '/');