var g_preview = {
    init() {
        const self = this
        g_preload.register('dplayer', {
            list: ['../public/js/DPlayer.min.js'],
            check: () => typeof(DPlayer) != 'undefined'
        })
        g_preload.register('viewer', {
            list: ['../public/js/viewer.min.js', '../public/js/jquery-viewer.min.js', '../public/css/viewer.min.css'],
            check: () => typeof($().viewer) != 'undefined'
        })

        g_action.registerAction({
            preview_mute: dom => g_setting.toggleValue('preview_mute'),
            item_unpreview: (dom, action, e) => self.unpreview(e)
        })

        g_style.addStyle(`preview`, `
            .item_previewing video {
                z-index: 2;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .item_previewing .card-preview > :not(#item_preview) {
               display: none;
            }
        `)

        g_setting.
        onSetConfig('preview_mute', b => {
            getEle('preview_mute').find('i').replaceClass('ti-', 'ti-volume' + (b ? '-off' : ''))
            self.getElement(' video')[0].muted = b
        })
        g_plugin.registerEvent('item_fullPreview', ev => this.on('onFullPreview', ev))
        g_plugin.registerEvent('item_preview', ev => this.on('onPreview', ev))

        $(document).on('mouseleave', '.datalist', () => self.unpreview())
    },
    getElement(s = '') {
        return $('#item_preview' + s)
    },
    unpreview(ev) {
        // 在视频上打开菜单
        if (g_menu.target && g_menu.target.hasClass('datalist-item')) return;
        if (ev && ev.relatedTarget) {
            // 还在范围内
            if ($(ev.relatedTarget).parents('#item_preview').length) return
        }
        let dom = $('.item_previewing').removeClass('item_previewing')
        dom.find('#item_preview').remove()
        g_plugin.callEvent('item_unpreview', { ev, dom })
    },
    async fullPreview(dom, md5, opts = {}) {
        let html, cb
        let data = await g_data.data_getData(md5)
        g_plugin.callEvent('item_fullPreview', { dom, md5, opts, data, html, cb }).then(({ dom, md5, opts, data, html, cb }) => {
            this.unpreview()
            if (!isEmpty(html)) {
                let modal = g_modal.modal_build({
                    id: 'fullPreview',
                    bodyClass: 'd-flex',
                    type: 'fullscreen',
                    once: true,
                    hotkey: true,
                    html,
                    width: '100%',
                })
                typeof(cb) == 'function' && cb(modal)
            }
        })
    },
    async preview(dom, md5, opts = {}) {
        let html, cb
        let data = await g_data.data_getData(md5)
        g_plugin.callEvent('item_preview', { dom, md5, opts, data, html, cb }).then(({ dom, md5, opts, data, html, cb }) => {
            this.unpreview()
            if (!isEmpty(html)) {
                getParent(dom, 'data-md5').addClass('item_previewing')
                let div = $(html).insertBefore(dom)
                typeof(cb) == 'function' && cb(div)
            }
        })
    },
    list: {},
    register(formats, opts) {
        toArr(formats).forEach(format => this.list[format] = opts)
        return this
    },

    on(method, ev) {
        let file = g_item.item_getVal('file', ev.data)
        ev.format = getExtName(file).toLowerCase()
        ev.file = file
        let cb = this.list?.[ev.format]?.[method] || ((ev) => {})
        cb(ev)
    },
}




g_preview.init()
