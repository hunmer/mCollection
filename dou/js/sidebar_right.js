var g_sideR = {

    init() {
        g_sidebar.register('right', {
            html: `
                <div id="detail_tabs" class="h-full"></div>
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
        })
        $('#sidebar_right').addClass('border-start shadow')
        // setTimeout(() => g_sidebar.show('right'), 250)
    }

}

g_sideR.init()