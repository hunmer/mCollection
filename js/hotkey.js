g_hotkey.init({
    defaultList: {
        'f5': {
            title: '刷新',
            content: "ipc_send('reload')",
            type: 2,
        },
        'f12': {
            title: '开发者工具',
            content: "ipc_send('devtool')",
            type: 2,
        },
        'ctrl+shift+!': {
            title: '切换左侧边',
            content: "doAction('sidebar_toggle,left')",
            type: 2,
        },
        'ctrl+shift+@': {
            title: '切换右侧边',
            content: "doAction('sidebar_toggle,right')",
            type: 2,
        },
        'f10': {
            title: '快捷键设置',
            content: "g_hotkey.modal_show()",
            type: 2,
        },
        'f11': {
            title: '全屏',
            content: "toggleFullScreen()",
            type: 2,
        },
    },
    saveData: (name, data) => local_saveJson(name, data),
    getData: (name, def) => local_readJson(name, def || {}),
})