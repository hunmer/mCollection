g_datalist.sort = {
    list: {
        asc: {
            title: '反序',
            action: 'reverse',
        },
        id: {
            title: 'ID',
            action: 'sort,id',
        },
        name: {
            title: '名称',
            action: 'sort,title',
        },
        date: {
            title: '创建日期',
            action: 'sort,birthtime',
        },
        size: {
            title: '大小',
            action: 'sort,size',
        },
    },
    init() {
        const self = this
        g_dropdown.register('datalist_sort', {
            position: 'end-top',
            offsetLeft: 10,
            // alwaysHide: true,
            parent: ['datalist_opts', 'sort'],
            list() {
                let ret = {}
                for (let [k, v] of Object.entries(self.list)) {
                    ret[k] = { title: v.title, action: v.action }
                }
                return ret
            }
        }).init()
    },
    register(name, opts) {
        opts.action = 'sort,' + name
        this.list[name] = opts
    },
    do_sort(name, items) {
        let opts = this.list[name]
        if (opts && opts.callback) {
            items = opts.callback(items)
        }
        return items
    }
}
g_datalist.sort.init()

assignInstance(g_datalist, {
    init() {
        const self = this
        $(`<div data-target-dropdown="datalist_opts" data-dropdown-pos="start-bottom" >
        <i class="me-1 ti ti-layout-2"></i>
    </div>`).appendTo('#datalist_actions')

        g_dropdown.register('datalist_opts', {
            position: 'start-bottom',
            offsetTop: 5,
            list: {
                detail: {
                    title: '信息',
                    icon: 'list-details',
                },
                view: {
                    title: '视图',
                    icon: 'grid-dots',
                },
                sort: {
                    title: '排序',
                    icon: 'sort-ascending-letters',
                },
            }
        })

        // TODO 注册自定义排序以及视图
        g_dropdown.register('detail', {
            position: 'end-top',
            offsetLeft: 10,
            alwaysHide: true,
            parent: ['datalist_opts', 'detail'],
            list: {
                name: {
                    title: '名称',
                    action: 'detail,name',
                },
                desc: {
                    title: '注释',
                    action: 'detail,desc',
                },
                duration: {
                    title: '时长',
                    action: 'detail,duration',
                },
                ext: {
                    title: '格式',
                    action: 'detail,ext',
                },
            }
        }).init()

        g_dropdown.register('datalist_view', {
            position: 'end-top',
            offsetLeft: 10,
            alwaysHide: true,
            parent: ['datalist_opts', 'view'],
            list: {
                // TODO 不同视图有不同的展示选项
                default: {
                    title: '卡片视图',
                    icon: '',
                    action: 'view,default',
                },
                table: {
                    title: '表格视图',
                    icon: '',
                    action: 'view,table',
                },
            }
        }).init()

        g_action.
            registerAction({
                range_view: dom => {
                    self.item_setWidth(dom.value)
                },
                setItemWidth(dom, action, e) {
                    let width = g_cache.itemWidth || parseInt(getConfig('itemWidth', 200))
                    if (e.ctrlKey) {
                        width += e.deltaY < 0 ? 20 : -20
                        self.item_setWidth(width)
                    }
                },
                sort(dom, action) { // 排序
                    g_datalist.tab_setVal('sort', action[1])
                },
                view(dom, action) { // 视图
                    g_datalist.tab_setVal('view', action[1])
                },
                reverse() { // 倒序
                    g_datalist.tab_setVal('reverse', !g_datalist.tab_getData('reverse'))
                },
                detail(dom, action) {
                    console.log(action.join(','))
                    g_setting.toggleValue(action.join(','))
                    g_datalist.tab_refresh()
                },
            })

        let keys = replaceArr(['%name', '%desc', '%duration', '%ext'], 'show,')
        g_setting.
            onSetConfig(keys, (v, k) => {
                getEle(k).toggleClass('active', v)
            }).
            onSetConfig({
                itemWidth(v) {
                    $('.datalist-item').width(v)
                    getEle({ input: 'range_view' }).val(v)
                }
            })
        g_setting.apply(keys)
    },

    item_setWidth(width) {
        width = parseInt(width)
        if (width <= 100) width = 100
        if (width >= 500) width = 500
        g_cache.itemWidth = width
        g_pp.setTimeout('itemWidth', () => setConfig('itemWidth', width), 50)
    },

})