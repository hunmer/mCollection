var g_videoList = {
    init() {
        this.list = {
            // title cover
            // TODO SQLITE3?
            md51: {
                file: 'res/1.mp4',
                folder: 'FOLDERA',
                clips: {

                },
            },
            md52: {
                file: 'res/2.mp4',
                folder: 'FOLDERB',
                clips: {

                },
            },
             md53: {
                file: 'res/1.mp4',
                folder: 'FOLDERA',
                clips: {

                },
            },
        }

        html(`
		<ol class="breadcrumb breadcrumb-arrows" id="folderList_parents"></ol>
        <div id="folderList_folders" class="mt-3">

        </div>
		`)
        this.render()
    },

     // 循环
    entries(callback) {
        for (let [name, item] of Object.entries(this.list)) {
            if (callback(name, item) === false) return false
        }
    },

    render() {
        let h = ''

        // 面包导航
        let r = g_folder.folder_getParents(folder)
        if (!isEmpty(folder) && folder != 'all') r.push(folder)
        r.unshift('all')
        r.forEach(k => {
            let title = k == 'all' ? '所有' : g_folder.folder_getValue(k, 'title')
            h += `<li class="breadcrumb-item" data-action="folder_subFolders" data-folder="${k}"><a href="#">${title}</a></li>`
        })
        $('#folderList_parents').html(h)

        h = ''
        let i = 0
        if (folder == 'all') folder = ''
        for (let [k, v] of Object.entries(g_folder.folder_getItems(folder, true))) {
            // TODO 
            h += `
            <label class="form-selectgroup-item flex-fill">
            <input type="checkbox" name="" value="${k}" class="form-selectgroup-input">
            <div class="form-selectgroup-label d-flex align-items-center p-1">
              <div class="ms-3 me-3">
                <span class="form-selectgroup-check"></span>
              </div>
              <div class="form-selectgroup-label-content d-flex align-items-center">
                <span class="avatar me-3 flex-fill">
                   <i class="ti ti-${v.icon} mr-2"></i>
                </span>
                <div class="flex-fill">
                  <div class="font-weight-medium">${v.title}</div>
                  <div class="text-muted"></div>
                </div>
              </div>
              ${g_folder.folder_getItems(k).length ? `
                <div class="flex-fill text-end">
                    <button class="btn p-2" data-action="folder_subFolders" data-folder="${k}">
                        <i class="ti ti-arrow-big-right fs-1"></i>
                    </button>
                  </div>
                ` : ''}
            </div>
          </label>`
            i++
        }
        $('#folderList_folders').html(h ? `
            <div class="mb-3">
                <label class="form-label">${i}个文件夹</label>
                <div class="form-selectgroup form-selectgroup-boxes d-flex flex-column">
                    ${h}
                </div>
            </div>
        ` : `<h3 class="text-center">这里什么都没有...</h3>`)
    }


}