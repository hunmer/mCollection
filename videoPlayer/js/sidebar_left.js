var g_sideL = {

    init() {
        g_sidebar.register('left', {
            html: `
            <div id="left_tabs"></div>`,
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
                // setCssVar('--offset-left', '300px')
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
            width_max: 300,
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

        setTimeout(() => g_sidebar.show('left'), 250)
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
            html: `
            <div class="card bg-unset h-full border-0">
               
              <div class="card-body p-0" style="height: calc(100vh - 41px)">
                <div class="tab-content h-full">
                </div>
              </div>

               <div class="d-flex tab-tabs ">
                  <ul class="nav nav-tabs col border-bottom-0 border-top" data-bs-toggle="tabs" role="tablist">
                  </ul>
                  <div class="col-auto">

                  </div>
                </div>

            </div>`,
            items: {},
        })

        loadRes(['js/detailTabs/files.js'], () => {
            self.tabs.tab_ative('files')
        })

    },
    register(id, opts, inst) {
        this.instance[id] = { opts, inst }
        this.tabs.add(opts.tab, id, false)
        inst.init && inst.init()
    },
}

g_leftTabs.init()