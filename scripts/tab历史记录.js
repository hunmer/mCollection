// ==UserScript==
// @name    tab历史记录
// @version    0.0.1
// @author    hunmer
// @description  ctrl+h 打开最近tab打开记录  
// @primary    1
// @updateURL   https://neysummer2000.fun/mCollection/scripts/tab历史记录.txt
// @namespace    a11a6f0f-615e-4201-99cb-d705affce1b0
// ==/UserScript==
({
    max: 20,
    key: g_db.current,
    save() {
        this.data = this.data.splice(0 - this.max).sort((a, b) => b.date - a.date)
        local_saveJson(this.key+'_tabHistory', this.data)
    },
    modal(){
        if(!g_dropdown.isShowing('tab_history')){
            g_dropdown.quickShow('tab_history')
        }
    },
    init() {
        const self = this
        
        self.data = local_readJson(self.key+'_tabHistory', []),
        
        g_plugin.registerEvent('tablist_set', ({vals}) => {
            let {title, data, id} = vals
            let {sqlite, type} = data
            if(sqlite == undefined) return
            
            sqlite = new SQL_builder(sqlite)
            let obj = {
                sqlite, type, title, id,
                date: new Date().getTime()
            }

            let index = sqlite ? self.data.findIndex(item => sqlite.equal(item.sqlite)) : -1
            if(index != -1){
                self.data.splice(index, 1)
                self.data.unshift(obj)
            }else{
                self.data.push(obj)
            }
            self.save()
        })


        g_action.registerAction({
            tab_history: () => self.modal(),
            tab_history_clear(){
                self.data = []
                self.save()
            },
            tab_hisoty_open: (dom, action) => g_datalist.tab_new(self.data.find(item => item.id == [action[1]]))
        })
        g_hotkey.register('ctrl+keyh',  {
            title: 'tab历史记录',
            content: "doAction('tab_history')",
            type: 2,
        })
        g_dropdown.register('tab_history', {
            position: 'end-top',
            offsetLeft: 5,
            autoClose: 'true',
            list() {
                let i = 0
                let list = {}
                self.data.forEach(v => {
                    i++
                    list[v.id] = {
                        title: v.title,
                        action: `tab_hisoty_open,${v.id}`
                    }
                })
                if(i == 0){
                    toast('没有标签记录!', 'danger')
                    return false
                }
                return Object.assign({
                    new: {
                        title: '清空记录',
                        action: 'tab_history_clear',
                    },
                    drive: {
                        type: 'divider'
                    },
                }, list)
            },
        })
        

    },

   
}).init()

