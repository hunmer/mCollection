Object.assign(g_datalist, {
    view_register(view, opts) {
        this.views[view] = Object.assign({

        }, opts)
        opts.init && opts.init()
    },
    // 切换视图
    view_switch(view, tab) {
        this.tab_method('tab_setValue', tab, 'data.view', view, true)
    },

    // 更新视图
    view_update(view, tab) {
        this.view_switch(this.view_getCurrent())
    },

    // 返回视图
    view_getCurrent(tab) {
        return this.tab_getOpts('view')
    },

    // 返回视图基本结构
    view_getContent(view) {
        return toVal(this.views[view || 'default'].container)
    },

    // 切换排序
    sort_switch(name, tab) {
        this.tab_method('tab_setValue', tab, 'data.sort', name, true)
    },

    async view_parseItems(view, items) {
        let opts = this.views[view]
        if (opts) {
            let html = (await Promise.all(items.map(data => this.item_parse({data, view})))).join('')
            return $(toVal(opts.container)).find('.datalist-items').html(html)
        }
    },

})