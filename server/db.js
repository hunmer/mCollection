const fs = require('fs')

module.exports = function(inst) {
    let obj = {
        init() {
            const self = this
            inst.registerRevice({
                db_connect: ({ file, opts }, ws) => { // TODO 提供ID参数？
                    // console.log(file, opts)
                    let db = this.getDB(file, opts)
                    // console.log(db)
                    inst.sendMsg(ws, 'db_connected', { file, opts })
                },
                db_fetch: ({ db, id, type, query, args }, ws) => {
                    let obj = self.getDB(db)
                    if (obj) {
                        let ret = obj.prepare(query)[type](...args)
                        // console.log(ret);
                        inst.sendMsg(ws, 'db_resp', { id, ret })
                    }
                },
                db_exec: ({ db, id, query }, ws) => {
                    let obj = self.getDB(db)
                    if (obj) {
                        let ret = obj.exec(query)
                        // console.log(ret);
                        inst.sendMsg(ws, 'db_resp', { id, ret })
                    }
                },
                // db是否连接
                db_check: () => {

                }
            })

        },
        dbs: {},
        opts: {},
        getDB(file, opts = {}) {
            if (!this.dbs[file]) {
                this.lastDB = file
                fs.access(file, fs.constants.F_OK | fs.constants.W_OK, err => {
                    if (err) {
                        if (err.code == 'ENOENT') {
                            // 不存在
                            return
                        }
                        opts.readOnly = true
                    }
                })
                let db = require('better-sqlite3')(file, opts);
                this.dbs[file] = db
                this.opts[file] = opts
            }
            return this.dbs[file]
        },

        data: require('../public/js/data.js').init({
            // 插入数据
            data_add(d) {
                return this.run(`INSERT INTO videos (tags, title, folders, json, desc, md5, date, birthtime, score, size, ext, deleted) VALUES (@tags, @title, @folders, @json, @desc, @md5, @date, @birthtime, @score, @size, @ext, @deleted)`, this.data_format(d))
            },
            init() {
                
            },
            data_import(data) {
                // todo 在这里把data缺少的参数补上
                // 能否接受数组参数？外部计算md5不方便
                for (let k in data) {
                    data[k] = Object.assign({
                        scrore: 0,
                        tags: [],
                        folders: [],
                        link: '',
                        title: '',
                        desc: '',
                        birthtime: 0,
                        size: 0,
                        score: 0,
                        json: {},
                        deleted: 0,
                        date: new Date().getTime()
                    }, data[k])
                }

                console.log(data)
                // this.data_insert(data, i => {

                // }, added => {
                //     console.log(added)
                // })
            },
        })
    }
    obj.init()
    return obj
}