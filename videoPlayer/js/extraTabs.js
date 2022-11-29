var g_extraTabs = {
    init() {
        const self = this

        this.tabs = g_tabs.register('extra_tabs', {
            target: '#extra_tabs',
            menu: ' ',
            saveData: false,
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
            onShow (tab, e) {
                self.instance[tab]  && self.instance[tab].opts.onTabChanged(tab, e)
            },
            onHide(tab){},
            onClose(tab) {},
            items: {}
        })

        loadRes([ 'js/extraTabs/cut.js' ], () => {
            g_extraTabs.tabs.tab_ative('cut') 
        })
    },

    instance: {},
    register(id, opts, inst) {
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

g_extraTabs.init()