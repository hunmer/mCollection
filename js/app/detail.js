var g_detail = {
    selected_keys: [],
    inst: {},
    columns: {},
    async getDetail(id, key){
        let r = {}
        await Promise.all(toArr(key).map(async n => {
            let inst = this.inst[n]
            if(inst) r[n] = await inst.get(id)
        }))
        return r
    },
    init() {
        const self = this

        g_sidebar.register('right', {
            html: `
                 <div id="detail" class="p-2 d-flex flex-wrap align-content-around h-full"></div>
            `,
            style: `
                #sidebar_right {
                    right: 0;
                    width: 200px;
                    top: var(--offset-top);
                    margin-right: 0px;
                }

                #sidebar_right.hideSidebar {
                    margin-right: -200px;
                }

                main[sidebar-right]{
                    padding-right: 200px;
                }
            `,
        })
        $('#sidebar_right').addClass('border-start')

        g_action.registerAction({
            detailChanged(dom, args, ev){
                let key = 'item.detail.changed.'+args[1]
                let cb = () => {
                    let list = self.selected_keys
                    let val = dom.value
                    g_plugin.callEvent(key, {dom, args, ev, list, val})
                }
                g_pp.setTimeout(key, cb, 500)
            },
        })
    },
    // 返回信息元素
    getColumnContent(name) {
        return $('#detail_columns_' + name)
    },

    // 更新指定信息
    async updateColumns(list) {
        let items = await Promise.all(this.selected_keys.map(md5 => g_data.data_get(md5)))
        toArr(list).forEach(async name => {
            let html = await this.last_columns[name].html(items)
            this.getColumnContent(name).replaceWith(this.getColumnPreset(name, html))
        })
    },

    getColumnPreset(name, html) {
        let item = this.last_columns[name] || {}
        return `<div id="detail_columns_${name}" class="w-full ${item.classes || ''}">${html}</div>`
    },

    // 展示列表
    async showList(list) {
        let cnt = list.length
        if(cnt == 0) return $('#detail').html('')
        let items = await Promise.all(list.map(md5 => g_data.data_get(md5)))

        g_plugin.callEvent('onBeforeShowingDetail', { items, columns: copyFn(this.columns) }).then(async ({ items, columns }) => {
            let h = ''
            this.last_columns = columns

            let sort = ['preview', 'color', 'title', 'tags', 'folders', 'desc', 'url', 'status']
            columns = Object.entries(columns).filter(([k, v]) => {
                return !(!v.multi && cnt > 1) // 过滤掉不支持复数选择的
            }).sort((a, b) => {
                return sort.indexOf(a[0]) - sort.indexOf(b[0]) // 排序
            })
            this.selected_keys = Object.values(items).map(item => item.md5)
            h = (await Promise.all(columns.map(async ([name, column]) => {
                let html = await column.html(items)
                return this.getColumnPreset(name, html)
            }))).join('')
            $('#detail').html(h).find('.lazyload').lazyload()
        })
    },

    update: function() {
        this.showList(this.selected_keys)
    },
}

g_detail.init()
