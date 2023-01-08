var g_sidebar = {
    // 移除style
    style_remove() {
        if (this.style) {
            this.style.remove()
            delete this.style
        }
    },
    // 初始化style
    style_init() {
        let css = `
            .sidebar {
                display: none;
                position: fixed;
                width: 200px;
                overflow-x: hidden;
                overflow-y: auto;
                height: calc(100vh - var(--offset-top));
                transition: margin 0.25s ease-out;
            }
        `;
        for (let [name, obj] of Object.entries(this.list)) css += obj.style
        this.style = $(`<style>${css}</style>`).appendTo('html')
    },

    init() {
        let self = this
        g_action.registerAction('sidebar_toggle', (dom, action) => {
            g_setting.toggleValue('sidebar_' + action[1])
        })

        let _arr = ['sidebar_left', 'sidebar_right']
        g_setting.onSetConfig(_arr, (v, k) => {
            k = k.substring(8)
            getEle('sidebar_toggle,' + k).toggleClass('text-primary', v)
            self.toggle(k, v)
        })

        $(() => g_setting.apply(_arr));

        /*   g_sidebar.register('top', {
            style: `
                #sidebar_top {
                    right: 0;
                    top: 0;
                    height: 100px;
                    width: 100vw;
                    margin-top: 0px;
                }

                #sidebar_top.hideSidebar {
                    margin-top: -200px;
                }

                main[sidebar-top]{
                    padding-top: 200px;
                }
            `,
        })


         g_sidebar.register('bottom', {
            style: `
                #sidebar_bottom {
                    right: 0;
                    bottom: 0;
                    height: 100px;
                    width: 100vw;
                    margin-bottom: 0px;
                }

                #sidebar_bottom.hideSidebar {
                    margin-bottom: -200px;
                }

                main[sidebar-bottom]{
                    padding-bottom: 200px;
                }
            `,
        })*/
    },

    list: {},
    register(name, opts) {
        opts = Object.assign({
            css: '',
            html: '',
            onShow: () => {},
            onHide: () => {},
        }, opts)
        this.list[name] = opts

        this.style_init()
        this.load(name)
    },

    get(name) {
        return this.list[name]
    },

    load(name) {
        let d = this.get(name)
        if (!d) return

        let id = 'sidebar_' + name
        let div = $(id)
        if (div.length) {
            div.html(d.html)
        } else {
            div = $(`
                <div class="sidebar h-full overflow-hidden" id="${id}" style="${d.css}">
                    ${d.html}
                </div>
            `).appendTo('html')
        }
    },

    sidebar_get(name) {
        return $('#sidebar_' + name)
    },

    show(name) {
        let div = this.sidebar_get(name)
        // todo call event
        if (div.length) {
            div.show().removeClass('hideSidebar')
            $('main').attr('sidebar-' + name, true)

            let opts = this.get(name)
            opts.onShow && opts.onShow.call(div)
        }
    },

    isShowing(name) {
        let div = this.sidebar_get(name)
        return div.length && !div.hasClass('hideSidebar')
    },

    toggle(name, show) {
        if (show == undefined) show = !this.isShowing(name)
        if (show) {
            this.show(name)
        } else {
            this.hide(name)
        }
        return show
    },

    hide(name) {
        let div = this.sidebar_get(name)
        if (div.length) {
            div.addClass('hideSidebar')
            $('main').attr('sidebar-' + name, null)
            let opts = this.get(name)
            opts.onHide && opts.onHide.call(div)
        }
    }
}

g_sidebar.init()