// ==UserScript==
// @name    不打开空标签
// @version    0.0.1
// @author    hunmer
// @description    自动关闭空标签
// @updateURL    
// @primary    1
// @namespace    a227a4cd-9910-47a4-b753-21380d9f0116

// ==/UserScript==

g_plugin.registerEvent('datalist.tab.initItems', ({tab, items}) =>{
    if(!items.length){
        g_datalist.tabs.close(tab)
        toast('空无一物...')
        return false
    }
})


