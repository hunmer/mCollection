// ==UserScript==
// @name    多开素材库
// @version    1.0
// @author    hunmer
// @description    同时开启多个无缝切换素材库
// @icon      box-multiple:green
// @updateURL   https://neysummer2000.fun/mCollection/scripts/多开素材库.js
// @namespace    8d57d204-96d1-4ecc-b955-73846f072306

// ==/UserScript==

var g_test = {
    _toDropdown: g_db.toDropdown,
    getViews: () => nodejs.win.getBrowserViews(),
    getList: () => {
        let list = []
        nodejs.win.getBrowserViews().forEach(({desc, id}) => {
            if(desc == 'db' && !list.includes(id)) list.push(id)
        })
        return list
    },
    init(){
        // todo 类似windows的缩略图预览
        g_db.toDropdown = (...args) => {
            let ret = this._toDropdown.apply(g_db, ...args)
            this.getList().forEach(id => {
                let title = ret[id]?.title 
                if(title != undefined) ret[id].title = '<span class="status-dot status-lime me-2"></span>' + title
            })
            return Object.assign(ret, {
                closeCurrent: {
                    title: '关闭当前',
                    icon: 'x',
                    class: 'text-primary',
                    action: 'db_closeCurrent',
                    attr: 'tabindex="-1"'
                },
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
            const views = this.getViews()
            if(views.find(view => view.id == 'main')){ // 打开第一个数据库
                return ipc_send('setViewAttr', {id: 'main', props: {desc: 'db', id: name}})
            }

            let index = views.findIndex(({id, desc}) => desc == 'db' && id == name)
            if(index != -1){
                if(isEmpty(g_db.current)) return // 页面第一次加载
                ipc_send('switchView', {id: name})
            }else{
                ipc_send('addView', {desc: 'db', id: name, url: 'file://'+location.pathname+`?local_from=ms_&localKey=db_${name}_&db=${name}`, active: true})
            }
            return false // 阻止在当前窗口切换素材库
        })

        g_plugin.registerEvent('window_onViewAdded', ({partition}) => {
            // console.log(data)
        })

        g_hotkey.register('ctrl+alt+arrowright',  {
            title: '切换到下一个已打开的素材库',
            content: "ipc_send('nextView')",
            type: 2,
        })

        g_hotkey.register('ctrl+alt+arrowleft',  {
            title: '切换到上一个已打开的素材库',
            content: "ipc_send('prevView')",
            type: 2,
        })

        g_action.registerAction({
            db_closeAll: () => {
                this.getViews().forEach(({id,desc}) => {
                    if(desc == 'main'){
                        ipc_send('switchView', {id})
                    }else
                    if(desc == 'db'){
                        ipc_send('removeView', {id, next: false})
                    }
                })
            },
            db_closeCurrent: () => {
                let views = this.getViews()
                if(views.length <= 1) return toast('只剩下一个素材库了，无法关闭！', 'danger')
                let {id} = nodejs.win.getCurrentView()
                ipc_send('removeView', {id, next: true})
            }
        })
    },

    test(){
    }

}

g_test.init()
