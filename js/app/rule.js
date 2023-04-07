var g_rule = {
    list: {},
    init() {
        this.timer = setInterval(() => this.refreshAll(), 1000 * 60 * 5)
        g_plugin.registerEvent('db_connected', ({ opts }) => {
            if (opts.type === DB_TYPE_DEFAULT) {
                setTimeout(() => this.refreshAll(), 1000)
            }
        })
    },
    register(name, opts, update = false) {
        this.list[name] = opts
        update && this.refreshAll()
        return this
    },

    get(name) {
        return this.list[name]
    },

    // 获取新建tab参数
    getTabParams(name, data) {
        let opts = this.get(name)
        if (opts) {
            return {
                sqlite: new SQL_builder(toVal(opts.sqlite, data)),
                title: opts.title,
                value: opts.value,
                type: name
            }
        }
    },

    getValue(name, k, defV) {
        let opts = this.get(name)
        if (opts[k] != undefined) {
            return opts[k]
        }
        return defV
    },

    // 获取侧边栏信息
    getSidebars() {
        let r = {}
        for (const [k, v] of Object.entries(this.list).sort((a, b) => {
                let a1 = a[1].primary || 0
                let b1 = b[1].primary || 0
                return b1 - a1
            })) {
            if (v.sidebar) r[k] = v.sidebar
        }
        return r
    },

    async refresh(name) {
        let opts = this.get(name)
        if (!opts || opts.update === false) return
        let cnt = await (new SQL_builder(toVal(opts.sqlite))).all(true)
        let el = getEle({ ruleBadge: name })
        if (el.length) el.html(cnt)

        opts.onUpdate && opts.onUpdate(cnt)
    },

    refreshAll() {
        Object.keys(this.list).forEach(name => this.refresh(name))
    }
}

g_rule.init()
g_rule
    .register('all', {
        title: '全部',
        sqlite: {
            method: 'select',
            search: 'id,md5',
            table: 'files',
        },
        sidebar: {
            title: `全部<span class="badge badge-outline text-blue ms-2" data-ruleBadge="all">0</span>`,
            icon: 'inbox',
            action: 'category,all',
            editAble: false,
        },

    })
    .register('random', {
        title: '随机模式',
        sqlite: {
            method: 'select',
            search: 'id,md5',
            table: 'files',
            order: 'RANDOM()',
        },
        sidebar: {
            title: '随机模式',
            icon: 'arrows-random',
            action: 'category,random',
        },
        primary: -9,
        update: false,
    })
    .register('trash', {
        title: '垃圾箱',
        sqlite: {
            method: 'select',
            search: 'md5',
            table: 'trash',
        },
        sidebar: {
            title: '回收站<span class="badge badge-outline text-red ms-2" data-ruleBadge="trash">0</span>',
            icon: 'trash',
            action: 'category,trash',
            menu: 'menu_trash',
        },
        primary: -10,
    })