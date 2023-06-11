// ==UserScript==
// @name    标签页前后进
// @version    0.0.1
// @author    hunmer
// @description    标签页前后进
// @updateURL    
// @primary    1
// @namespace    18ede266-7a7c-4314-8eda-6434ccb8f749

// ==/UserScript==

({
    data: local_readJson(g_db.current+'_tabForward', []),
    init(){
        $(`
            <div data-action="tab_back" class="tab_nav" title="后退"><i class="ti ti-arrow-left"></i></div>
            <div data-action="tab_forward" class="tab_nav" title="前进"><i class="ti ti-arrow-right"></i></div>
            <div data-action="tab_refresh" class="tab_nav" title="刷新"><i class="ti ti-refresh"></i></div>
        `).insertBefore('#title')

        g_action.registerAction({
            tab_back: () => this.tab_goTo(-1),
            tab_forward: () => this.tab_goTo(1),
            tab_refresh: () => g_datalist.tab_refresh(),
        })

        g_plugin.registerEvent('tablist_set', ({vals}) => {
            let {title, data, id} = vals
            let {sqlite, type} = data
            if(sqlite == undefined) return
            
            sqlite = new SQL_builder(sqlite)
            this.data.push({
                sqlite, type, title, id,
                date: new Date().getTime()
            })
            this.save()
            this.tab_goTo()
        })
        g_plugin.registerEvent('tablist_reset', () => {
            this.data = []
            this.save()
            this.tab_goTo()
        })
        g_plugin.registerEvent('db_connected', () =>  this.tab_goTo())
       
    },
    
    save(){
        local_saveJson(g_db.current+'_tabForward', this.data)
    },

    tab_goTo(offset, tab){
        tab ??= g_datalist.getCurrentTab()
        let sqlite = g_datalist.tab_getData('sqlite', tab)
        let len = this.data.length
        let index = sqlite ? this.data.findIndex(item => sqlite.equal(item.sqlite)) : len -1
        if(index != -1 && offset != undefined){
            index += offset
            let item = this.data[index]
            if(item) g_datalist.tab_new(item)
        }
        getEle('tab_back').toggleClass('opacity-25', !len || index < 1)
        getEle('tab_forward').toggleClass('opacity-25', !len || index >= len - 1)
    }

}).init()







