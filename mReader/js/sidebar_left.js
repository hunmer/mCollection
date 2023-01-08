var g_sideL = {

    init() {
        g_sidebar.register('left', {
            html: `
            <div id="left_tabs" class="overflow-hidden"></div>`,
            style: `
                :root {
                    --offset-left: 300px;
                }
                #sidebar_left {
                    left: 0;
                    top: 0;
                    width: var(--offset-left);
                    margin-left: 0px;
                    height: 100vh;
                }
                #sidebar_left.hideSidebar {
                    margin-left: calc(0px - var(--offset-left));
                }
                main[sidebar-left]{
                    padding-left: var(--offset-left);
                }
            `,
            onShow: e => {
                setCssVar('--offset-left', '300px')
                g_sizeable.restore('sidebar_left')
            },
            onHide: e => {
                setCssVar('--offset-left', '0px')
            },
        })
        $('#sidebar_left').addClass('border-end shadow')

        g_sizeable.register('sidebar_left', {
            selector: '#sidebar_left',
            memory: true,
            allow: ['right'],
            width_min: 150,
            width_max: 400,
            style: {
                backgroundColor: 'unset',
            },
            change: (t, i) => {
                if (t == 'width') { // 调整高度
                    setCssVar('--offset-left', i + 'px')
                    return { resize: false }
                }
            }
        })

        // setTimeout(() => g_sidebar.show('left'), 250)
    }
}

g_sideL.init()


var g_leftTabs = {
    instance: {},
    init() {
        const self = this
        let tabs = this.tabs = g_tabs.register('left_tabs', {
            target: '#left_tabs',
            saveData: false,
            menu: ' ',
            hideOneTab: false,
            getTabIndex(tab) {
                return self.instance[tab].opts.index
            },
            onShow(tab, e) {
                self.instance[tab] && self.instance[tab].opts.onTabChanged(tab, e)
            },
            onHide(tab, ev) {

            },
            onClose(tab) {

            },
            items: {},
        })

        loadRes(['js/detailTabs/chapters.js'], () => {
            self.tabs.tab_ative('chapters')
        })

    },
    register(id, opts, inst) {
        this.instance[id] = { opts, inst }
        this.tabs.add(opts.tab, id, false)
        inst.init && inst.init()
    },
}

g_leftTabs.init()