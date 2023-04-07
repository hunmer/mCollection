var g_search = {
    searchBar: `
        <div class="input-icon mb-3">
            <input type="text" value="" class="form-control" placeholder="搜索..." data-input="input_search" data-keydown="input_search_keydown">
            <span class="input-icon-addon">
              <i class="ti ti-search fs-2"></i>
            </span>
        </div>
    `,
    replaceHTML(html){
        return html.replace('%search_bar%', this.searchBar)
    },
    defailtTab: 'file',
    isFirstShowed: false,
    init() {
        const self = this
        // todo 多个快捷键
        g_hotkey.hotkey_register('ctrl+keyj', {
            title: "搜索界面",
            content: "doAction('seach_show')",
            type: 2
        })
        g_hotkey.hotkey_register('ctrl+tab', {
            title: "搜索界面-下一个",
            content: `g_modal.isShowing('modal_search') && g_search.tabs.tab_next()`,
            type: 2
        })

        g_action.registerAction({
            seach_show: () => self.show(),
            input_search: dom => self.tab_search(self.tabs.getCurrentTab(), dom.value),
            input_search_keydown(dom, a, e) {
                let items = self.tab_getItems()
                if (e.keyCode == 13 && items.length) {
                    items[0].click()
                }
            },
            search_file_item: dom => self.modal.hide(),
            search_tag_item(dom) {
                // todo 写在tags.js里
                let tag = dom.dataset.value
                if (tag != '') g_tags.showTag(tag)
                self.modal.hide()
            }
        })

        self.modal = g_modal.modal_build({
            title: '搜索',
            show: false,
            id: 'modal_search',
            // static: false,
            scrollable: true,
            bodyClass: 'p-0',
            html: `
                <div id='search_div'></div>
            `,
            onShow(){
                if (!self.isFirstShowed) {
                    self.isFirstShowed = true
                    self.tabs.tab_active(self.defailtTab)
                }else{
                    self.input_focus()
                }
            }
        })

        self.tabs = g_tabs.register('search', {
            target: '#search_div',
            saveData: false,
            hideOneTab: false,
            items: copyObj(this.tabItems),
            menu: `
            <div class="d-flex">
                <a class="nav-link p-2" data-action="" title="更多选项"><i class="ti ti-dots fs-2"></i></a>
            </div>
            `,
            parseContent(k, v) {
                return content
            },
            onShow(tab, ev) {
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

        // self.show()
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
    tabs_register(name, opts) {
        this.list[name] = opts

        let tab = {}
        tab[name] = Object.assign({ id: name }, opts.tab)
        this.tabItems = Object.assign(this.tabItems, tab)
        this.tabs.setItems(copyObj(this.tabItems))
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