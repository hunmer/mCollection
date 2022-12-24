var g_sideR = {

    init() {
        g_sidebar.register('right', {
            html: `
               <div id="detail_tabs" class=" overflow-x-hidden w-full h-full p-0 m-0" style="overflow-y: clip;"></div>
            `,
            style: `
                :root {
                    --offset-right: 400px;
                }
                #sidebar_right {
                    right: 0;
                    width: var(--offset-right);
                    top: var(--offset-top);
                    margin-right: 0px;
                }

                #sidebar_right.hideSidebar {
                    margin-right: calc(0px - var(--offset-right));
                }

                main[sidebar-right]{
                    padding-right: var(--offset-right);
                }
            `,
            onShow: e => {
                g_sizeable.restore('sidebar_right')
            },
            onHide: e => {
            },
        })
        $('#sidebar_right').addClass('border-start shadow ')
        g_sizeable.register('detailTabs', {
            selector: '#detail_tabs',
            memory: true,
            allow: ['left'],
            width_min: 300,
            width_max: 600,
            style: {
                backgroundColor: 'unset',
            },
            change: (t, i) => {
                if (t == 'width') { // 调整高度
                    setCssVar('--offset-right', i + 'px')
                    return { resize: false }
                }
            }
        })
        setTimeout(() => g_sidebar.show('right'), 250)
    },


}

g_sideR.init()
