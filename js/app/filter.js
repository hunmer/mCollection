
var g_filter = {
    list: {},
    init() {
        const self = this
        g_action.registerAction({
            filter_click(dom, action){ // filter入口事件
                self.filter_get(action[1]).dropdown.show(dom.parentElement, 'start-bottom')
            },
            filter_clear(dom, action){ // 清空过滤器
                g_tabler.removeToolTips()
                self.list[action[1]].clearData({})
            }
        })
    },

    opts: {},
    // 注册过滤器
    filter_set(name, opts) {
        this.list[name] = opts

        let id = 'filter_'+name
        Object.assign(opts, {
            id, name,
            dropdown: new _DropDown(id, {
                width: '350px',
                alwaysHide: true,
                html: `<div id="${id}" class="p-2 dropdown_content"></div>`,
                onShown(){
                    opts.onShow && opts.onShow()
                },
                onHide(){
                    opts.onHide && opts.onHide()
                },
            })
        })
        opts.init()
        this.update()
    },

    setOpts(k, v) {
        return setObjVal(this.opts, k, v)
    },

    getOpts(k, def) {
        return getObjVal(this.opts, k) || def
    },

    // 获取过滤器元素
    filter_getEle(name) {
        return $('#_filter_' + name)
    },

    // 过滤器更新显示
    filter_update(name) {
        this.filter_getEle(name).replaceWith(this.filter_getHTML(name))
    },

    // 获取过滤器
    filter_get(name) {
        return this.list[name]
    },

    // 获取过滤器入口HTML
    filter_getHTML(name, item) {
        if (!item) item = this.filter_get(name)
        return  `
            <div id="_filter_${name}" class="p-2">
             <a class="nav-link dropdown-toggle" data-contenx="filter_clear,${name}" data-action="filter_click,${name}" data-bs-toggle="tooltip" data-bs-placement="top" title="${item.desc}">
                 ${item.icon ? `<i class="ti ti-${item.icon}"></i>` : ''}
                ${item.title || ''}
                <span class="badge bg-primary ms-2 hide1"></span>
             </a>
            </div>
        `
    },

    // 刷新filter图标(入口)列表
    update(data = {}) {
        g_filter.setOpts('filter', data)
        let h = ''
        Object.entries(this.list).forEach(([name, item]) => h += this.filter_getHTML(name, item))

        let div = $('#filters').html(h)
        typeof(bootstrap) != 'undefined' && div.find('[data-bs-toggle="tooltip"]').each((i, el) => new bootstrap.Tooltip(el))
    }


}

g_filter.init()