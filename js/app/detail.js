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
                 <div id="detail" class="p-2 d-flex flex-wrap align-content-around" style="min-height: 60vh">
                </div>
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
            detailChanged: (dom, args, ev) => {
                let key = 'item.detail.changed.'+args[1]
                console.log(key)
                let cb = () => {
                    let list = this.selected_keys
                    let val = dom.value
                    g_plugin.callEvent(key, {dom, args, ev, list, val})
                }
                g_pp.setTimeout(key, cb, 500)
            },
        })

    },


    // 保存文本更改
    saveChanges() {
        if (this.timer) {
            clearTimeout(self.timer)
            delete this.timer
            .forEach(async md5 => {
                let data = await g_data.data_get(md5)
                g_data.data_set(md5, {
                    title: getEle({ input: 'saveDetail,title' }).val(),
                    desc: getEle({ input: 'saveDetail,desc' }).val(),
                    link: getEle({ input: 'saveDetail,link' }).val(),
                })
            })
            // TODO 更新datalist信息
        }
    },

    save() {
        // this.item.name = 
    },


    // 返回信息元素
    getColumnContent(name) {
        return $('#detail_columns_' + name)
    },

    // 更新指定信息
    async updateColumns(list) {
        let md5 = this.selected_keys[0]
        if (md5) {
            let data = await g_data.data_get(md5)
            toArr(list).forEach(async name => {
                let html = await this.last_columns[name].html(data)
                this.getColumnContent(name).replaceWith(this.getColumnPreset(name, html))
            })
        }
    },

    getColumnPreset(name, html) {
        return `<div id="detail_columns_${name}" class="w-full">${html}</div>`
    },

    // 展示列表
    async showList(list) {
        this.saveChanges() // 保存上一次的更改
        let items = await Promise.all(list.map(md5 => g_data.data_get(md5)))

        g_plugin.callEvent('onBeforeShowingDetail', { items, columns: copyFn(this.columns) }).then(async ({ items, columns }) => {
            let h = ''
            this.last_columns = columns

            let sort = ['preview', 'color', 'title', 'tags', 'folders', 'desc', 'url', 'status']
            columns = Object.entries(columns).sort((a, b) => {
                return sort.indexOf(a[0]) - sort.indexOf(b[0])
            })
            this.selected_keys = Object.values(items).map(item => item.md5)

            if (this.selected_keys.length == 1) {
                h = (await Promise.all(columns.map(async ([name, column]) => {
                    let html = await column.html(items[0])
                    return this.getColumnPreset(name, html)
                }))).join('')
            } else {
                // TODO 多选的另外一个column列表...
            }

            $('#detail').html(h).find('.lazyload').lazyload()
        })
    },

    update: function() {
        this.showList(this.selected_keys)
    },
}

g_detail.init()
