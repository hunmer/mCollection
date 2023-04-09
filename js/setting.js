g_setting.setDefault('switchShow', 'CommandOrControl+Alt+X')
g_setting.tabs.general = {
    title: '常规',
    icon: 'home',
    elements: {
        switchShow: {
            title: '切换前后台显示',
            value: () => getConfig('switchShow', ''),
        },
    }
}
g_setting.tabs.library = {
    title: '素材库',
    icon: 'box',
    elements: {
        // TODO 全局导入设置
        importType: {
            title: '导入方式',
            require: true,
            type: 'select',
            list: { copy: '复制', move: '移动', link: '链接' },
            value: () => getConfig(g_db.current + '_importType', 'copy'),
        },
    }
}

g_setting.onSetConfig({
    switchShow(val){
        let empty = isEmpty(val)
        nodejs.globalShortcut[empty ? 'unregister' : 'register'](val, () => {
            ipc_send('toggleShow')
        })
    }
})

$(function () {
    g_setting.apply(['darkMode', 'switchShow'])
});