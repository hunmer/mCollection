
const path = require('path')
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 40000 });
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(msg) {
        try{
            onMessage(JSON.parse(msg), ws);
        } catch (err){
            console.error(err)
        }
    })
});

const express = require('express');
const app = express();
app.use(express.static(__dirname));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.listen(40001);

var g_revices = {}
function registerRevice(name, callback) {
    let isArr = Array.isArray(name)
    if (typeof(name) == 'object' && !isArr) {
        Object.assign(g_revices, name)
        return this
    }
    if (!isArr) name = [name];
    for (let alisa of name) g_revices[alisa] = callback;
    return this
}

function broadcast(type, data) {
    let msg = typeof(type) == 'object' ?  JSON.stringify(type) :  JSON.stringify({type, data})
    wss.clients.forEach(ws => {
        ws.send(msg);
    })
}

function onMessage(data, ws) {
    let d = data.data
    let type = data.type
    if (g_revices[type]) return g_revices[type](d, ws);
    switch (type) {
        case 'login':
            broadcast(data)
            break;
    }
}

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

registerApi('/test', 'get', (req, res) => {
    let data = {
        "status": "success",
        "data": {

        }
    };
    echoJson(res, data);
});

var db = require('./sqlite.js')({registerRevice, sendMsg, broadcast})
console.log('服务器启动成功')