const fs = require('fs')

module.exports = function(inst) {
    let obj = {
        columns: {},
        all(db, query, args = []) {
            return db.prepare(query).all(...args)
        },
        init() {
            const self = this
            inst.registerRevice({
                db_connect: ({ file, opts }, ws) => { // TODO 提供ID参数？
                    self.loadDB(file, opts)
                    inst.sendMsg(ws, 'db_connected', { file, opts })
                },
                db_fetch: ({ db, id, type, query, args }, ws) => {
                    let obj = self.getDB(db)
                    if (!obj) obj = self.loadDB(db)

                    // TODO 发送调试信息，且可以被接受且展示...
                    // console.log('fetch', db, query, args, obj)
                    try {
                        // TODO sqlite 语句类，分为 [method, table, where] 部分.方便服务端进行解析。
                        // 因为如果要实现自动去多余参数的话，在这边拼接sqlite语句会更方便且高效
                        // eg:
                        // if(method == 'insert into' || method == 'update'){
                        //     let columns = self.columns[db][table]

                        //     query = ().toString()

                        // }

                        // let tables = self.columns[db]
                        // if(tables){
                        //     let [method, a, b] = query.split(' ')
                        //     method = method.toLowerCase()
                        //     if (['update', 'insert'].includes(method)) {
                        //         let columns = tables[method == 'update' ? a : b]
                        //         for(let i=0;i<args.length;i++){
                        //             let item = args[i]
                        //             for(let k in item){
                        //                 if (!columns[k]) {
                        //                     console.log('删除'+k)
                        //                     delete item[k]
                        //                 }
                        //             }
                        //         }
                        //     }
                        // }
                        let ret = obj.prepare(query)[type](...args)
                        // console.log('result', ret);
                        inst.sendMsg(ws, 'db_resp', { id, ret })
                    } catch (err) {
                        console.error(err)
                    }
                },
                db_exec: ({ db, id, query }, ws) => {
                    // console.log('exec', query)
                    let obj = self.getDB(db)
                    if (!obj) obj = self.loadDB(db)

                    try {
                        let ret = obj.exec(query)
                        inst.sendMsg(ws, 'db_resp', { id, ret })
                    } catch (err) {
                        console.error(err)
                    }
                },
                // 关闭db
                db_close: ({ db }, ws) => {
                    inst.sendMsg(ws, 'db_close', { db, ret: self.closeDB(db) })
                },
                // 重载db
                db_reload: ({ db }, ws) => {
                    let ret = self.closeDB(db)
                    if (ret) {
                        self.getDB(db, self.opts[db])
                    }
                    inst.sendMsg(ws, 'db_reload', { db, ret })
                },
                // db是否连接
                db_check: () => {

                }
            })

        },
        dbs: {},
        opts: {},
        closeDB(file) {
            let db = this.getDB(file)
            if (db) {
                db.close()
                delete this.dbs[file]
                return true
            }
        },
         loadDB(file, opts = {}) {
            if (this.getDB(file)) return
            // this.lastDB = file
            fs.access(file, fs.constants.F_OK | fs.constants.W_OK, err => {
                if (err) {
                    if (err.code == 'ENOENT') {
                        // 不存在
                        return
                    }
                    opts.readonly = true
                }
            })
            let db = require('better-sqlite3')(file, opts)
            if (!opts.readonly) {
                db.unsafeMode(false)
                // this.columns[file] = await this.getColumns(db)
            }
            this.dbs[file] = db
            this.opts[file] = opts
            return db
        },
        getDB(file, opts = {}) {
            return this.dbs[file]
        },

        async getTables(db) {
            return (await this.all(db, `SELECT * FROM sqlite_master WHERE type='table'`)).map(table => table.name).filter(table => ['sqlite_sequence'].includes(table) === false)
        },

        async getColumns(db) {
            let list = {};
            await Promise.all((await this.getTables(db)).map(async table => {
                list[table] = {};
                (await this.all(db, `PRAGMA table_info(${table})`)).forEach(({ name, type, notnull }) => {
                    list[table][name] = { type, notnull }
                })
            }))
            return list
        },
    }
    obj.init()
    return obj
}

function toArr(v) {
    return Array.isArray(v) ? v : v == undefined ? [] : [v]
}