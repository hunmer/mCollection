/* 服务器的用处:
1.HTTPAPI
2.处理文件操作事务（在另外一个线程内操作，在electron会卡顿)
3.给插件提供

本地和服务器之间采用websocket连接
怎么让插件取注册API? 在electron进程require会卡顿吗？
*/

const path = require('path')
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 41594 });
const files = require('./file.js')
wss.on('connection', function connection(ws) {
    // sendMsg(ws, {type: 'msg', msg: 'welcome'});
    ws.on('message', function incoming(msg) {
        // console.log(msg.toString())
        onMessage(JSON.parse(msg), ws);
    })
});

function getClients(type = 'client') {
    let r = []
    wss.clients.forEach(ws => {
        if (ws._type = type) r.push(ws)
    })
    return r
}

var g_revices = {}

function unregisterRevice(name){
    delete g_revices[name]
}

function registerRevice(name, callback) {
    let isArr = Array.isArray(name)
    if (typeof(name) == 'object' && !isArr) {
        Object.assign(g_revices, name)
        return this
    }

    if (!isArr) name = [name];
    for (var alisa of name) g_revices[alisa] = callback;
    return this
}

// let db = require('./db.js')({ registerRevice, sendMsg })
function onMessage(data, ws) {
    let d = data.data
    let type = data.type
    // console.log(JSON.stringify(data,null, 2))
    if (g_revices[type]) {
        return g_revices[type](d, ws);
    }
    switch (type) {
        case 'exit':
            return process.exit()
        case 'connected':
            ws._type = d.type
            break;
        case 'task_add':
            switch (d.type) {
                case 'copy':
                case 'move':
                    return files[d.type](d.file, d.saveTo, d, (err, ret) => {
                        let fun = () => sendMsg(ws, 'task_ret', Object.assign(ret, { err: err }));
                        if (d.type == 'copy') {
                            let thumb = path.dirname(d.file) + '\\' + path.basename(d.file, path.extname(d.file)) + '_thumbnail.png'
                            if (files.exists(thumb)) { // 封面存在,直接拷贝，一个个生成太麻烦了
                                return files[d.type](thumb, path.dirname(d.saveTo) + '\\cover.jpg', {}, (err, ret) => fun())
                            }
                        }
                        fun()
                    });
            }
            break;
    }
}

const express = require('express');
const app = express();
app.use(express.static(__dirname));
// const logger = (req, res, next) => {
//   console.log(
//     `请求的ip地址是：${req.ip}, 请求的路径是：${
//       req.url
//     }`);
//   next();
// };
// app.use(logger);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.listen(41597);

function registerApi(url, type, callback) {
    app[type](url, callback);
}

function echoJson(res, data) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function sendMsg(client, type, data) {
    client.send(JSON.stringify({ type, data }));
}

registerApi('/', 'get', (req, res) => {
    var data = {
        "status": "success",
    };
    echoJson(res, data);
});

function waitFor(name, send) {
    if(!send) send = {type: name}
    return new Promise(reslove => {
        let client = getClients()
        if (!client.length) reslove({ status: 'error', msg: '客户端不在后台运行!' })
        client[0].send(JSON.stringify(send))
        registerRevice(name, data => {
            unregisterRevice(name)
            reslove(data)
        })
    })
}

registerApi('/tags', 'get', (req, res) => {
    waitFor('tags').then(data => {
        echoJson(res, data);
    })
});

registerApi('/exit', 'get', (req, res) => {
    process.exit()
});

// 应用版本信息 /api/application/info
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

/* 查询导入结果 */
var importResults = {}
registerRevice('importResult', d => {
     importResults[d.id] = d.added
})
registerApi('/importResult', 'get', (req, res) => {
    let {id} = req.query
    if(importResults[id] != undefined){
        echoJson(res, {
            msg: '导入完成',
            added: importResults[id]
        });
    }else{
        echoJson(res, {
            msg: '任务查询中...',
        });
    }
});

registerApi('/api/item/addFromPaths', 'post', (req, res) => {
    // path 必填，本地文件路径
    // name 必填，欲添加图片名
    // website 图片来源网址
    // annotation 图片注释
    // tags 图片标签
    // folderId 如果带有此参数，图片将会添加到指定文件夹
    let client = getClients()
    if (!client.length) return echoJson(res, { status: "error", msg: '客户端不在运行中...' });

    let data = req.body
    let items = (data.items || [data]).map(item => {
        item.file = item.path
        item.link = item.website
        item.title = item.name
        item.desc = item.annotation
        delete item.path
        return item
    });
    let id = files.guid()
    sendMsg(client[0], 'data_import', {items, id})
    echoJson(res, {
        status: "success",
        msg: '成功添加' + items.length + '个文件...',
        id
    });
})

console.log('服务器启动成功')