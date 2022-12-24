var g_search = {

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
            seach_show() {
                self.show()
            },
            input_search(dom) {
                self.tab_search(self.tabs.getCurrentTab(), dom.value)
            },
            input_search_keydown(dom, a, e){
                let items = self.tab_getItems()
                if(e.keyCode == 13 && items.length){
                    items[0].click()
                }
            },
            search_folder_item(dom) {
                g_folder.showFolder(dom.dataset.value)
                self.modal.hide()
            },
            search_file_item(dom) {
                self.modal.hide()
            },
            search_tag_item(dom) {
                // todo 写在tags.js里
                let tag = dom.dataset.value
                if (tag != '') g_tags.showTag(tag)
                self.modal.hide()
            }
        })

        self.modal = g_modal.modal_build({
            title: '搜索',
            id: 'modal_search',
            show: false,
            // static: false,
            scrollable: true,
            bodyClass: 'p-0',
            html: `
                <div id='search_div'></div>
            `
        })

        let content = `
        <div class="input-icon mb-3">
            <input type="text" value="" class="form-control" placeholder="搜索..." data-input="input_search" data-keydown="input_search_keydown">
            <span class="input-icon-addon">
              <i class="ti ti-search fs-2"></i>
            </span>
        </div>
        `
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
                self.input_focus(tab)
            }
        })

        self.tabs_register('folder', {
            tab: {
                title: '<i class="ti ti-folder fs-2 me-2"></i>文件夹',
                getTabIndex: () => 2,
                html: `${content}<div class="search_result list-group list-group-flush overflow-auto"></div>`
            },
            onSearch(s) {
                let r = []
                g_folder.entries((k, v) => {
                    // 有子目录的不要
                    if (!g_folder.folder_getItems(k).length) {
                        let { title, icon } = v
                         if(PinYinTranslate.check(s, title)){
                            r.push({ title, icon, value: k })
                        }
                    }
                })
                return r
            },
            onParse(item) {
                return `
                    <div class="list-group-item result_item" data-action="search_folder_item" data-value="${item.value}" tabindex="0">
                      <div class="row">
                        <div class="col-auto">
                          <a href="#" tabindex="-1">
                            <span class="avatar"><ti class="ti ti-${item.icon} fs-2"></i></span>
                          </a>
                        </div>
                        <div class="col text-truncate">
                          <a href="#" class="text-body d-block" tabindex="-1">${item.title}</a>
                          <div class="text-muted text-truncate mt-n1"></div>
                        </div>
                      </div>
                    </div>
                `
            }
        })
        self.tabs_register('tag', {
            tab: {
                title: '<i class="ti ti-tag fs-2 me-2"></i>标签',
                getTabIndex: () => 1,
                html: `${content}<div class="search_result btn-list p-2"></div>`
            },
            onSearch(s) {
                let r = []
                g_tags.tags.forEach(tag => {
                    if(PinYinTranslate.check(s, tag)){
                        r.push({ title: tag, value: tag })
                    }
                })
                return r
            },
            onParse(item) {
                return `
                    <button class="btn btn-outline-primary result_item" data-action="search_tag_item" data-value="${item.value}">${item.title}</button>
                `
            }
        })
        self.tabs_register('file', {
            tab: {
                title: '<i class="ti ti-file fs-2 me-2"></i>文件',
                getTabIndex: () => 3,
                html: `${content}<div class="search_result list-group list-group-flush p-2"></div>`
            },
            async onSearch(s) {
                return isEmpty(s) ? [] : await g_data.all(`SELECT * FROM videos WHERE deleted=0 AND title LIKE '%${s}%' LIMIT 30;`)
            },
            onParse(item) {
                // console.log(item)
                // TODO 根据文件类型显示不同的图标
                return g_datalist.item_parse(item, '', 'list')

                let cover = g_item.item_getVal('cover', item)
                return `
                    <div class="list-group-item result_item" data-action="search_file_item" data-value="${item.md5}" tabindex="0">
                      <div class="row">
                        <div class="col-auto">
                          <a href="#" tabindex="-1">
                            <img src="${cover}" class="w-full">
                          </a>
                        </div>
                        <div class="col text-truncate">
                          <a href="#" class="text-body d-block" tabindex="-1">${item.title}</a>
                          <div class="text-muted text-truncate mt-n1">${item.desc}</div>
                        </div>
                      </div>
                    </div>
                `
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
            ret.forEach(item => {
                h += onParse(item)
            })
        }
        this.getContent(name).html(h)
        // todo 搜索框边框颜色
    },

    getContent(name){
        return this.tabs.getContent(name).find('.search_result')
    },

    tab_getItems(name){
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
        this.modal.show()
        this.input_focus()
    },

    input_focus(tab) {
        setTimeout(() => this.tabs.getContent(tab).find('input').val('').focus(), 50) // 自动聚焦
    }

}

g_search.init()