g_detailTabs.register('downlist', {
    onTabChanged: old => {
        g_downloader.refresh()
    },
    tab: {
        id: 'downlist',
        title: `<i class="ti ti-download fs-2"></i><span class="badge bg-red badge-pill hide" id='badge_downloading'></span>`,
        html: `
        <div class="card h-full">
          <div class="card-header">
            <h3 class="card-title d-flex w-full">
                <div class="col-auto">
                    <button data-action="download_add" class="btn btn-cyan" title="添加下载"><i class="ti fs-2 ti-plus"></i></button>
                    <button data-action="download_start" class="btn btn-teal" title="开始下载"><i class="ti fs-2 ti-player-play"></i></button>
                    <button data-action="download_clear" class="btn btn-red" title="清空全部"><i class="ti fs-2 ti-trash"></i></button>
                    <button data-action="download_clear_completed" class="btn btn-yellow" title="清空已下载"><i class="ti fs-2  ti-refresh"></i></button>
                    <button data-action="download_path" class="btn btn-cyan" title="当前下载目录"><i class="ti fs-2 ti-folder"></i></button>
                    <button data-action="download_settings" class="btn" title="当前下载目录"><i class="ti fs-2 ti-settings"></i></button>
                    <button data-action="download_checklist" class="btn" title="检查任务"><i class="ti fs-2 ti-check"></i></button>
                </div>
                <div class="col">
                    <select class="form-select">
                        <option selected disabled>选择剧名</option>
                    </select>
                </div>
            </h3>
          </div>
          <div id="download_list" class="list-group list-group-flush list-group-hoverable" style="max-height: calc(100vh - 100px);overflow-y: auto;padding-bottom: 100px;">
          </div>
        </div>
         `
    },
}, {
    init() {
        $(`<span class="badge bg-cyan-lt cursor-pointer h-fit me-2" data-action="aria2c_setting" id="badge_downloadSpeed">连接中...</span>`).insertBefore('#traffic')
    }
})