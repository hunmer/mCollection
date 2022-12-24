module.exports = function(inst) {

    let obj = {
        init() {
            const self = this
            let db = this.db = require('../node_modules/better-sqlite3')('team.db', {

            });
            db.exec(`
                CREATE TABLE IF NOT EXISTS message(
                     id      INTEGER PRIMARY KEY AUTOINCREMENT,
                     text   TEXT,
                     user   VARCHAR(256),
                     type   VARCHAR(256),
                     date   INTEGER,
                     data   TEXT
                );
            `)
            // 

            inst.registerRevice({
                chat_msg(d, ws) {
                    // TODO 如果存在ID，则为修改
                    d = Object.assign({
                        date: new Date().getTime(),
                        data: ''
                    }, d)

                    let ret = self.insertData(d)
                    if (ret.changes) {
                        d.id = ret.lastInsertRowid
                        inst.broadcast('chat_msg', d)
                    }
                },
                get_msgs(d, ws) {
                    inst.sendMsg(ws, 'msg_list', db.prepare(`SELECT * FROM message ORDER by id desc LIMIT ${d.limit} OFFSET ${d.start};`).all())
                },
                get_videos(d, ws) {
                    inst.sendMsg(ws, 'video_list', db.prepare(`SELECT * FROM message WHERE type = 'douyin_video' ORDER by id desc LIMIT ${d.limit} OFFSET ${d.start};`).all())
                },
                coll_upload(ids, ws) {
                    let all = db.prepare("SELECT data FROM message WHERE type = 'douyin_video';").all().map(item => String(JSON.parse(item.data).aid))
                    let ret = ids.filter(id => !all.includes(id))
                    ret.length && inst.sendMsg(ws, 'coll_upload', ret)
                }
            })

            // console.log(self.insertData({
            //     text: 'msg1',
            //     user: '廖延杰',
            //     type: '',
            //     date: new Date().getTime(),
            //     data: '',
            // }))
            // console.log(db.prepare('SELECT * FROM message').all())
        },

        insertData(obj, table = 'message') {
            let keys = Object.keys(obj)
            return this.db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(s => '@'+s).join(',')})`).run(data_format(obj))

        },
    }
    obj.init()
    return obj
}




function data_format(d) {
    d.data = JSON.stringify(d.data)
    return d
}