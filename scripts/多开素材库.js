// ==UserScript==
// @name    多开素材库
// @version    1.0
// @author    hunmer
// @description    
// @namespace    8d57d204-96d1-4ecc-b955-73846f072306

// ==/UserScript==

var g_test = {
    _toDropdown: g_db.toDropdown,
    getViews: () => nodejs.win.getBrowserViews(),
    getList: () => uniqueArr([g_db.current, ...nodejs.win.getBrowserViews().map(view => view.db)]),
    init(){
        // todo 类似windows的缩略图预览
        g_db.toDropdown = (...args) => {
            let ret = this._toDropdown.apply(g_db, ...args)
            this.getList().forEach(id => {
                let title = ret[id]?.title 
                if(title != undefined) ret[id].title = '<span class="status-dot status-lime me-2"></span>' + title
            })
            return Object.assign(ret, {
                closeAll: {
                    title: '关闭全部',
                    icon: 'x',
                    class: 'text-danger',
                    action: 'db_closeAll',
                    attr: 'tabindex="-1"'
                }
            })
        }

        g_plugin.registerEvent('db_switch', ({name, opts}) => {
            g_dropdown.hide('db_menu')
            let views = this.getViews()
            let index = views.findIndex(({db}) => db == name)
            if(index == -1 && views.length == 1 && isEmpty(views[0].db)) index = 0
            if(index != -1){
                ipc_send('setViewAttr', {index, props: {db: name, id: name}})
                if(views[index].db == name && !isEmpty(g_db.current)){ // 库已经加载，做简单切换
                    ipc_send('switchView', {id: name})
                    return false
                }
                return
            }
            ipc_send('addView', {db: name, url: `%url%?local_from=ms_&localKey=db_${name}_&db=${name}`, active: true})
            return false // 阻止在当前窗口切换素材库
        })

        g_plugin.registerEvent('window_onViewAdded', ({partition}) => {
            // console.log(data)
        })

        g_hotkey.register('ctrl+arrowright',  {
            title: '切换到下一个已打开的素材库',
            content: "ipc_send('nextView')",
            type: 2,
        })

        g_hotkey.register('ctrl+arrowleft',  {
            title: '切换到上一个已打开的素材库',
            content: "ipc_send('prevView')",
            type: 2,
        })

        g_action.registerAction({
            db_closeAll: () => {
                this.getViews().forEach(({id,desc}) => ipc_send(desc == 'main' ? 'switchView' : 'removeView', {id, next: false}))
            }
        })
    },

    test(){
    }

}

g_test.init()
