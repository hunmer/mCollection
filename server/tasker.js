// 事务通讯

var g_tasker = {
    tasks: {},
    init() {
        const self = this
        // 注册socket回应
        g_client.registerRevice({
            task_ret: data => self.task_revice(data)
        })
    },
    task_add(id, data, opts) {
        this.tasks[id] = {
            data: data,
            opts: opts
        }
        data.id = id

        this.task_next()
        // g_client.send('task_add', data)
        // 接受信息时
    },

    // 下个任务
    task_next() {
        let keys = Object.keys(this.tasks)
        if (keys.length) {
            if (keys[0] != this.currentId) {
                this.currentId = keys[0]
                g_client.send('task_add', this.tasks[keys[0]].data)
            }
        }
    },

    // 处理回应
    task_revice(data) {
        this.task_finish(data.id, data)
    },

    task_get(id) {
        return this.tasks[id]
    },

    task_finish(id, args, event = 'onComplete') {
        let task = this.task_get(id).opts
        task[event] && task[event](args, id)
        this.task_remove(id)
        this.task_next()
    },

    task_remove(id) {
        delete this.tasks[id]
    }

}
g_tasker.init()