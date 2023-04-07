// 等待socket连接后

class QueryList {
    constructor() {
        this.list = {}
        this.id = 0
    }
    add(callback) {
        let id = ++this.id
        this.list[id] = callback
        return id
    }
    done(id, ret) {
        if (this.list[id]) {
            this.list[id](ret)
            delete this.id[id]
        }
    }
}

var queryList = new QueryList()
class Result {

    constructor(db, query) {
        this.db = db
        this.query = query
        // console.log(query)
    }

    send(type, args) {
        // console.log(type, args)
        return new Promise(reslove => {
            let id = queryList.add(reslove) // 回调id
             g_client.send(type == 'exec' ? 'db_exec' : 'db_fetch', { db: this.db, query: this.query, args, id, type })
        })
    }

    get(...args) {
        return this.send('get', args)
    }

    exec(...args) {
        return this.send('exec', args)
    }

    all(...args) {
        return this.send('all', args)
    }

    run(...args) {
        return this.send('run', args)
    }
}

class Database {

    constructor(file, opts) {
        this.file = file
        this.opts = opts
        setTimeout(() => g_client.send('db_connect', { file, opts }), 1500) // TODO 有时候会启动失败
    }

    exec(query, file) {
        return new Result(file || this.file, query).exec()
    }

    prepare(query, file) {
        return new Result(file || this.file, query)
    }

    run(query, args, file){
        return new Result(file || this.file, query).run(args)
    }
}

g_client.registerRevice({
    db_resp: ({ id, ret }) => queryList.done(id, ret)
})


module.exports = function(file, opts) {
    return new Database(file, opts)
}