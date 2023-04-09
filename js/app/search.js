var g_search = {
    replaceHTML(html){
        return html.replace('%search_bar%', `
        <div class="input-icon mb-3">
            <input type="text" value="" class="form-control" placeholder="搜索..." data-input="input_search" data-keydown="input_search_keydown">
            <span class="input-icon-addon">
              <i class="ti ti-search fs-2"></i>
            </span>
        </div>
    `)
    },
    defaultTab: 'file',
    init() {
        const self = this

        g_hotkey.register('ctrl+keyj', {
            title: "搜索界面",
            content: "doAction('seach_show')",
            type: 2
        })
        g_hotkey.register('ctrl+tab', {
            title: "搜索界面-下一个",
            content: `g_modal.isShowing('modal_search') && g_search.tabs.next()`,
            type: 2
        })

        g_action.registerAction({
            seach_show: () => self.show(),
            input_search: dom => self.tab_search(self.tabs.getActive(), dom.value),
            input_search_keydown(dom, a, e) {
                let items = self.tab_getItems()
                if (e.keyCode == 13 && items.length) {
                    items[0].click()
                }
            },
        })

        self.modal = g_modal.modal_build({
            title: '搜索',
            show: false,
            id: 'modal_search',
            bodyClass: 'p-0 overflow-x-hidden',
            // static: false,
            scrollable: true,
            html: `<div id='search_div'></div>`,
            onShow(){
                if(self.changed){
                    self.changed = 0
                    self.refresh()
                    self.tabs.setActive(self.defaultTab)
                }
                self.input_focus()
            }
        })

        self.tabs = new TabList({
            name: 'search',
            container: '#search_div',
            items: copyObj(this.tabItems),
            parseContent: () => content,
            event_shown({tab}) {
                self.input_focus(tab, 150)
            }
        })

        // 在预览时改变视图
        g_plugin.registerEvent('item_preview', ({ dom }) => {
            dom = $(dom)
            if (dom.parents('.search_result').length) {
                dom.parents('.col-auto').addClass('col-12')
            }
        })

        g_plugin.registerEvent('item_unpreview', ({ dom }) => {
            dom = $(dom)
            if (dom.parents('.search_result').length) {
                dom.find('.col-12').removeClass('col-12')
            }
        })
    },

    tabItems: {},
    async tab_search(name, val) {
        let { onSearch, onParse } = this.list[name]
        let ret = this.results = await onSearch(val)

        let h = ''
        if (ret && ret.length) {
            h = (await Promise.all(ret.map(item => onParse(item)))).join('')
        }
        this.getContent(name).html(h)
        // todo 搜索框边框颜色
    },

    getContent(name) {
        return this.tabs.getContent(name).find('.search_result')
    },

    tab_getItems(name) {
        return this.getContent(name).find('.result_item')
    },

    list: {},
    changed: 0,
    tabs_register(name, opts) {
        opts.tab.id = name
        this.list[name] = opts
        this.changed++
    },

    refresh(){
        this.tabs.setItems(Object.entries(this.list).map(([k, v]) => v.tab))
    },

    show() {
        this.modal.method('show')
    },

    input_focus(tab, timeout = 25) {
        setTimeout(() => this.tabs.getContent(tab).find('input').val('').focus(), timeout) // 自动聚焦
    }

}

g_search.init()

g_search.tabs_register('file', {
    tab: {
        title: '<i class="ti ti-file fs-2 me-2"></i>文件',
        getTabIndex: () => 3,
        html: g_search.replaceHTML(`%search_bar%<div class="search_result list-group list-group-flush p-2"></div>`)
    },
    async onSearch(s) {
        return isEmpty(s) ? [] : await g_data.all(`SELECT * FROM files WHERE title LIKE '%${s}%' LIMIT 30;`)
    },
    async onParse(item) {
        // TODO 根据文件类型显示不同的图标
        return g_datalist.item_parse({data: item, view: 'list'})
    }
})

        
