var g_detailTabs = {
    init() {
        const self = this

        this.tabs = g_tabs.register('detail_tabs', {
            target: '#detail_tabs',
            saveData: false,
            menu: '  ',
            // menu: `<a class="nav-link p-2" data-action="detail_toggle"><i class="ti ti-layout-sidebar-right fs-2"></i></a>`,
            getTabIndex(tab){
                return self.instance[tab].opts.index
            },
            parseContent (k, v){
                return `
                    <div class="datalist h-full pb-4">
                        <div class="row row-cards datalist-items"></div>
                   </div>
                `
            },
            // parseTab: (k, v) => v.title,
            onShow (tab, ev) {
                self.instance[tab] && self.instance[tab].opts.onTabChanged(ev)
            },
            onHide(tab, ev){
               self.instance[tab] && self.instance[tab].opts.onTabHiden(ev)
            },
            onClose(tab) {

            },
            items: {}
        })
        // 'js/detailTabs/webview.js', 
        loadRes(['js/detailTabs/test.js'], () => {
            // this.tabs.tab_ative('webview')
        })
    },

    instance: {},
    register(id, opts, inst) {
        opts = Object.assign( {
            onTabChanged: e => {},
            onTabHiden: e => {},
        }, opts)

        this.instance[id] = { opts, inst }
        this.tabs.add(opts.tab, id, false)
        inst.init && inst.init()
    },

    // 新建视窗
    tab_new(data) {
        // getConfig('oneTab') && this.tabs.clear()
        this.tabs.try_add(function(v) { // 不重复打开
            return v[1].data.id == data.id
        }, {
            title: data.title,
            data: {
                file: data.file
            },
        })
    },

}

g_detailTabs.init()