g_plugin.init({
    defaultPlugins: {
        "49253cb9-dfd9-46de-83cd-229430938fc6": {
            "title": "云同步",
            "primary": "1",
            "desc": "通过第三方服务器实现多设备云同步数据",
            "version": "0.0.1",
            "enable": true
        },
    },
    menu_add(opts) {
        let h = `<a class="dropdown-item" href="#" data-action="${opts.action}">${opts.title}</a>`
        $(h).insertAfter('#dropdown_plugins .dropdown-divider')
    },
})