var g_sideL = {

    init() {
        g_sidebar.register('left', {
            html: `<div>
                <div id="group_list" class="p-2 pt-0 overflow-x-hidden overflow-y-auto" style="height: calc(100vh - 50px);">
                      <ol class="breadcrumb breadcrumb-arrows" id="folderList_parents"></ol>
                      <div id="folderList_folders" class="mt-3">
                      </div>
                </div>

                <div class="d-flex w-full position-absolute bottom-0 p-2">
                    <a data-action="history" title="历史" class="btn btn-pill btn-ghost-secondary"><i class="ti ti-history"></i></a>
                    <a data-action="settings,general" title="设置" class="btn btn-pill btn-ghost-warning"><i class="ti ti-settings"></i></a>
                    <a title="其他" class="btn btn-pill btn-ghost-primary" href="#dropdown-more" data-bs-toggle="dropdown" data-bs-auto-close="outside" role="button" aria-expanded="false"><i class="ti ti-dots"></i></a>
                    <div class="dropdown-menu" id="dropdown-more">
                        <h6 class="dropdown-header">软件</h6>
                        <a class="dropdown-item" data-action="homepage">
                            <i class="ti ti-brand-github fs-2"></i>
                            项目主页
                        </a>
                        <a class="dropdown-item" onclick="ipc_send('url', 'https://www.52pojie.cn/thread-1688063-1-1.html')">
                            <i class="ti ti-brand-hipchat fs-2"></i>
                            52pojie
                        </a>
                        <a class="dropdown-item" data-action="update_check">
                            <i class="ti ti-clock-2 fs-2"></i>
                            检测更新
                            <span id="badge_update" class="badge bg-danger ms-auto">News</span>
                        </a>
                        <a class="dropdown-item" data-action="about">
                            <i class="ti ti-alert-circle fs-2"></i>
                            关于
                            <span class="badge bg-primary ms-auto">1.0.2</span>
                        </a>
                    </div>
                </div>

            </div>`,
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
                    margin-left: -var(--offset-left);
                }
                main[sidebar-left]{
                    padding-left: var(--offset-left);
                }
            `,
            onShow: e => {
                // setCssVar('--offset-left', '200px')
            },
            onHide: e => {
                setCssVar('--offset-left', '0px')
            },
        })
        $('#sidebar_left').addClass('border-end shadow')
        // setTimeout(() => g_sidebar.show('left'), 250)
    }
}

g_sideL.init()