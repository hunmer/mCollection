g_action.registerAction({
      folder_subFolders: dom => g_folder.showFolder(dom.dataset.folder)
  })


g_folder.init({
   getCurrent(){
      return this.currentFolder
   },

   async showFolder(folder = ''){
        this.currentFolder = folder

        let h = ''
        // 面包导航
        let r = g_folder.folder_getParents(folder)
        if (!isEmpty(folder) && folder != 'all') r.push(folder)
        r.unshift('all')
        r.forEach(k => {
            let title = k == 'all' ? '所有' : g_folder.folder_getValue(k, 'title')
            h += `<li class="breadcrumb-item" data-action="folder_subFolders" data-folder="${k == 'all' ? '' : k}"><a href="#">${title}</a></li>`
        })
        $('#folderList_parents').html(h)

        h = ''
        let i = 0
        for (let [k, v] of Object.entries( g_folder.folder_getItems(folder, true))) {
            h += `
            <div class="col-6 cursor-pointer mb-2" data-action="folder_subFolders" data-folder="${k}">
                <div class="card bg-primary text-primary-fg">
                  <div class="card-stamp">
                    <div class="card-stamp-icon bg-white text-primary">
                      <i class="ti ti-${v.icon}"></i>
                    </div>
                  </div>
                  <div class="card-body">
                    <h3 class="card-title">${v.title}</h3>
                    <p>
                     <span class="badge bg-warning">5个文件</span>
                     <span class="badge bg-warning mt-1">20分32秒</span>
                    </p>
                  </div>
                </div>
            </div>`
            i++
        }

        // 加上视频文件
        let items = await g_data.getFolderVideos(folder)
        items.forEach(item => {
            let d = JSON.parse(item.json)
            let n = getFileName(item.file)
              h += `
                <div class="col-6 cursor-pointer mb-2" data-action="video_loadVideo" data-md5="${item.md5}" data-file="${item.file}">
                    <div class="card bg-secondary text-secondary-fg">
                      <div class="card-stamp">
                        <div class="card-stamp-icon bg-white text-primary">
                          <i class="ti ti-video"></i>
                        </div>
                      </div>
                      <div class="card-body">
                        <h3 class="card-title text-nowarp" title="${n}">${n}</h3>
                        <p>
                         <span class="badge bg-warning">${getTime(d.duration)}</span>
                         <span class="badge bg-warning mt-1">${d.width+'x'+d.height}</span>
                        </p>
                      </div>
                    </div>
                </div>`
        })

        $('#folderList_folders').html(h ? `
            <div class="mb-3">
                <label class="form-label">${i}个文件夹</label>
                <div class="row">
                    ${h}
                </div>
            </div>
        ` : `<h3 class="text-center">这里什么都没有...</h3>`)

     },

    saveData: (name, data) => local_saveJson(name, data),
    getData: (name, def) => local_readJson(name, def || {}),
    update(save = false) {
        console.log('update')
        this.showFolder()
    },
})


g_folder.list = {
    "default": {
        "title": "未分组",
        "icon": "folder",
        "parent": ""
    },
    "F1": {
        "title": "folderA",
        "icon": "folder",
        "parent": ""
    },
    "F2": {
        "title": "folderb",
        "parent": "",
        "icon": "folder"
    },
    "F3": {
        "title": "folderc",
        "parent": "F1",
        "icon": "folder"
    },
}
g_folder.update()
