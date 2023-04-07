g_datalist.view_register('table', {
    init(){
        let view = '.datalist[data-view="table"]'
        let item = '.datalist-item'
        g_style.addStyle('view_table', `
         
        `)
    },
    container: () => {
        let r = Object.values(getConfig(replaceArr(['%name', '%desc', '%ext', '%duration'], 'show,')))
        return `
                 <div class="datalist table-responsive overflow-y-auto" style="height: calc(100vh - 100px);">
                    <table class="table table-vcenter card-table">
                      <thead>
                        <tr>
                          <th width="150px"></th>
                         ${OR(r[0], `<th>标题</th>`)}
                         ${OR(r[1], `<th>注释</th>`)}
                         ${OR(r[2], `<th>扩展</th>`)}
                         ${OR(r[3], `<th class="w-1">时长</th>`)}
                        </tr>
                      </thead>
                      <tbody onScroll="g_datalist.onScroll(this)" class="datalist-items p-2">
                      </tbody>
                    </table>
                  </div>
                `
    },
    async item(d) {
        let r = Object.values(getConfig(replaceArr(['%name', '%desc', '%duration', '%ext'], 'show,')))
        let { desc, media } = await g_detail.getDetail(d.id, ['desc', 'media'])
        let duration = media ? media.duration : 0
        return `
            <tr data-mousedown="item_click" data-dbclick="item_dbclick" {md5} {dargable}>
              <th><img src="${d.cover}" class="thumb" {preview}></th>
              ${OR(r[0], `<td class="text-muted">${d.title}</td>`)}
              ${OR(r[1], `<td class="text-muted">${desc || ''}</td>`)}
              ${OR(r[2] && duration, `<td class="text-muted">${getTime(duration)}</td>`)}
              ${OR(r[3], `<td class="text-muted">${getExtName(d.file)}</td>`)}
            </tr>
        `
    }

})