// ==UserScript==
// @name    标签页快捷跳转
// @version    0.0.1
// @author    hunmer
// @description    ctrl+1-9快捷跳转当前标签页
// @updateURL    
// @primary    1
// @namespace    05e50cba-4208-42d5-9e77-04c67ede67de

// ==/UserScript==

// (() => {
    let observe = new domObserver({
        selector: 'tablist',
        checkUpdate: dom => dom.tagName == 'TABLIST',
        onShown(dom){
            // TODO 展示时短暂显示标签编号
        }
    })

    g_action.registerAction({
        tab_activeTo(_, action){
            let tab = observe.current
            tab && g_tabs.list[tab.data('name')].setActiveIndex(action[1])
        }
    })

    for(let i = 1;i<=9;i++){
        g_hotkey.register('ctrl+'+i,  {
            title: '激活tab'+i,
            content: `doAction('tab_activeTo,${i-1}')`,
            type: 2,
        })
    }

// })()
