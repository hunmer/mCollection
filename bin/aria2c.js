const fs = require('fs')

module.exports = function(opts) {
    return {
        start() {
            const self = this
            const Aria2 = require("aria2")
            let aria2 = new Aria2(Object.assign({
                host: 'localhost',
                port: 6800,
                secure: false,
                secret: '',
                path: '/jsonrpc'
            }, opts.config));
            aria2.on("onDownloadStart", ([d]) => {
                self.item_on('downloading', d.gid);
            });
            aria2.on("onDownloadComplete", ([d]) => {
                self.item_on('complete', d.gid);
            });
            aria2.on("onDownloadPause", ([d]) => {
                self.item_on('pause', d.gid);
            });
            aria2.on("onDownloadStop", ([d]) => {
                self.item_on('stop', d.gid);
            });
            aria2.on("onDownloadError", ([d]) => {
                self.item_on('error', d.gid);
            });
            aria2
                .open()
                .then(async () => {
                    self.callEvent('conect_success')
                    self.startup = true;
                })
                .catch(err => {
                    self.callEvent('connect_error')
                    if (!self.startup) {
                        self.startup = true;
                        require('child_process').execFile(opts.path + 'aria2c.exe', ['--conf-path='+opts.conf], { cwd: opts.path }, function(error, stdout, stderr) {
                            console.log(error);
                            console.log(stdout)
                        })
                        setTimeout(() => self.start(), 3000);
                    }
                });

            self.aria2 = aria2
            return self
        },
        init() {
            this.start()
            return this;
        },
        setItemUpdate(callback, ms = 1000) {
            this.itemUpdate = setInterval(() => {
                let a = []
                let ids = []
                let downloading = this.item_gets('downloading', 'gid,id')
                for (let [guid, item] of Object.entries(downloading)) {
                    a.push(['tellStatus', item[0],
                        ['gid', 'totalLength', 'completedLength', 'downloadSpeed']
                    ]);
                    ids.push(item[1])
                }
                a.length && this.aria2.multicall(a).then(r => callback(r, ids))
            }, ms)
            return this
        },
        setGlobalTasker(callback, ms = 2000) {
            this.clearGlobalTasker()
            this.timer = setInterval(() => {
                this.aria2.call('getGlobalStat').then(r => callback(r))
            }, ms)
            return this
        },
        clearGlobalTasker() {
            this.timer && clearInterval(this.timer)
            return this
        },
        exit() {
            this.aria2.call('shutdown').then(r => {
                if (r == 'OK') this.callEvent('exit')
            })
        },
        // public
        addUris(items, overwrite = false) {
            const self = this
            return new Promise(resolve => {
                let urls = [];
                let guids = []
                items.forEach(item => {
                    let { pathName, fileName } = item;
                    if (!overwrite && fs.existsSync(pathName + '\\' + fileName)) return;
                    
                    let url = item.realUrl || item.url;
                    item = Object.assign({
                        date: new Date().getTime(),
                    }, item)
                    guids.push(self.item_add(item))
                    urls.push(['addUri', [url], { dir: pathName, out: fileName }]);
                    this.callEvent('addUri', item)
                })
                if (urls.length) {
                    this.aria2.multicall(urls).then(gids => {
                        guids.forEach((guid, i) => self.item_set(guid, 'gid', gids[i][0]))
                        resolve([gids, guids]);
                    })
                } else {
                    resolve([]);
                }
            });
        },

        // 根据gid移除单个任务
        remove(gid) {
            // 会触发stop事件
            return this.aria2.call('remove', gid)
        },
        // item
        items: {},
        // 返回指定类型
        item_gets(status, keys) {
            let ret = {}
            for (let [k, v] of Object.entries(this.items)) {
                if (v.status == status) {
                    let r = []
                    for (let k of keys.split(',')) r.push(v[k]);
                    ret[k] = r
                }
            }
            return ret
        },
        // 添加任务
        item_add(item) {
            let guid = this.guid()
            this.items[guid] = item
            return guid
        },
        // 设置任务属性
        item_set(guid, k, val) {
            if (!this.items[guid]) this.item[guid] = {}
            this.items[guid][k] = val
        },
        // 根据guids移除多个任务
        item_remove(guids) {
            if (!Array.isArray(guids)) guids = [guids]

            let params = []
            for (let guid of guids) {
                let item = this.item_get(guid)
                item && item.gid && params.push(['remove', item.gid]);
            }
            // 会触发stop事件
            this.aria2.multicall(params).then(gids => {
                // [gid, gid, {msg: ''}]
            })
        },
        item_getGid(gid) {
            return Object.keys(this.items).find(guid => {
                return this.items[guid].gid == gid
            })
        },
        item_get(guid) {
            return this.items[guid]
        },
        // 任务事件
        item_on(status, guid) {
            if (guid) {
                let item = this.item_get(this.item_getGid(guid))
                item.status = status
                this.callEvent(status, { id: item.id, gid: item.gid })
            }
        },
        // events 
        events: {},
        callEvent: function(event, vals) {
            this.events[event] && this.events[event](vals)
        },
        on(event, callback) {
            this.events[event] = callback
            return this
        },
        // until
        guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

    }
}