module.exports = function(inst) {
    let obj = {
        init() {
            const self = this
            inst.registerRevice({
                db_connect: ({ file, opts }, ws) => { // TODO 提供ID参数？
                    // console.log(file, opts)
                    let db = this.getDB(file, opts)
                    // console.log(db)
                    inst.sendMsg(ws, 'db_connected', {file, opts})
                },
                db_fetch: ({db, id, type, query, args}, ws) => {
                    let obj = self.getDB(db)
                    if(obj){
                        let ret = obj.prepare(query)[type](...args)
                        // console.log(ret);
                        inst.sendMsg(ws, 'db_resp', {id, ret})
                    }
                },
                db_exec: ({db, id, query}, ws) => {
                    let obj = self.getDB(db)
                    if(obj){
                        let ret = obj.exec(query)
                        // console.log(ret);
                        inst.sendMsg(ws, 'db_resp', {id, ret})
                    }
                },
                // db是否连接
                db_check: () => {

                }
            })

        },
        dbs: {},
        opts: {},
        getDB(file, opts) {
            if (!this.dbs[file]) {
                let db = require('better-sqlite3')(file, opts);
                this.dbs[file] = db
                this.opts[file] = opts
            }
            return this.dbs[file]
        }
    }
    obj.init()
    return obj
}