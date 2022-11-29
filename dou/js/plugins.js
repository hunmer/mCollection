g_plugin.init({
    defaultPlugins: {
        "49253cb9-dfd9-46de-83cd-229430938fc6": {
            "title": "云同步",
            "primary": "1",
            "desc": "通过第三方服务器实现多设备云同步数据",
            "version": "0.0.1",
            "enable": true
        },
        "22e6db23-df3c-46d0-804d-7f49f9f1a681": {
            "title": "cookie同步",
            "primary": "1",
            "desc": "上传COOKIE并共享",
            "version": "0.0.1",
            "enable": true
        },
        "bb9f5100-28cf-4a04-9277-70e77c90ad7a": {
            "title": "特别关注",
            "primary": "1",
            "desc": "每日显示特别关注账号的最新视频",
            "version": "0.0.1",
            "enable": true
        }
    },
    menu_add(opts) {
        let h = `<a class="dropdown-item" href="#" data-action="${opts.action}">${opts.title}</a>`
        $(h).insertAfter('#dropdown_plugins .dropdown-divider')
    },

})