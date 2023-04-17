g_datalist.view_register('table', {
    init(){
        let view = '.datalist[data-view="table"]'
        let item = '.datalist-item'
        g_style.addStyle('view_table', `
         
        `)
    },
    noMore: `
    <tr class="nomore text-center">
      <td colspan="3">没有更多了...</td>
    </tr>
    `,
    container: () => {
        let r = Object.values(getConfig(replaceArr(['%name', '%desc', '%ext', '%duration'], 'detail,')))
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
        let r = Object.values(getConfig(replaceArr(['%name', '%desc', '%duration', '%ext'], 'detail,')))
        let duration = r[2] ? (await g_detail.getDetail(d, 'media'))?.media?.duration : 0
        let desc = r[1] ? (await g_detail.getDetail(d, 'desc'))?.desc : ''
        return `
            <tr data-mousedown="item_click" data-dbclick="item_dbclick" {md5} {dargable}>
              <th><img src="${d.cover}" class="thumb" {preview}></th>
              ${OR(r[0], `<td class="text-muted">${d.title}</td>`)}
              ${OR(desc, `<td class="text-muted">${desc}</td>`)}
              ${OR(duration, `<td class="text-muted">${getTime(duration)}</td>`)}
              ${OR(r[3], `<td class="text-muted">${getExtName(d.file)}</td>`)}
            </tr>
        `
    }

})