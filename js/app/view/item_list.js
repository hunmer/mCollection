g_datalist.view_register('list', {
    init(){
        let view = '.datalist[data-view="list"]'
        let item = '.datalist-item'
        g_style.addStyle('view_list', `
         
        `)
    },
    container: `
         <div class="datalist list-group list-group-flush overflow-y-auto" style="height: calc(100vh - 100px);">
         </div>
        `,
    async item(d) {
      let {tags, desc, media} = await g_detail.getDetail(d.id, ['desc', 'media', 'tags'])
        let duration = media ? media.duration : 0
      
        return `
             <div class="list-group-item" data-mousedown="item_click" data-dbclick="item_dbclick" {md5} {dargable}>
              <div class="row">
                <div class="col-auto">
                  <a href="#" tabindex="-1">
                    <img class="avatar thumb" src="${d.cover}" {preview}>
                  </a>
                </div>
                <div class="col text-truncate">
                  <a href="#" data-action="files_load" class="text-body d-block">
                    ${g_tabler.build_badges(tags.map(tid => g_tags.folder_getValue(tid, 'title')))}
                    ${d.title}
                  </a>
                  <div class="text-muted text-truncate mt-n1">${desc || ''} ${duration ? getTime(duration) : ''}</div>
                </div>
              </div>
            </div>
        `
    }

})