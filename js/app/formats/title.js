(() => {

    g_plugin.registerEvent('onBeforeShowingDetail', ({ items, columns }) => {
        if (items.length == 1) {
            columns.title = {
                multi: false,
                html([d]){
                    return `
                    <div class="input-group input-group-sm mb-2">
                      <span class="input-group-text" id="inputGroup-sizing-sm">名称</span>
                      <input data-input="detailChanged,title" data-change="detailChanged,title" type="text" class="form-control form-control-flush border-hover" placeholder="..." value="${getFileName(d.title, false) || ''}">
                    </div>
                `
                }
            }
        }
    })

    g_plugin.registerEvent('item.detail.changed.title', ({ list, val }) => {
        list.forEach(async md5 => {
            // 更改本地文件名称
            let file = await g_item.item_getVal('file', md5)
            if (nodejs.fs.existsSync(file)) {
                let { dir, name, ext } = nodejs.path.parse(file)
                nodejs.fs.renameSync(file, dir + '\\' + val + ext)
                // TODO 更新视图数据里的data-file
            }
            await g_data.date_setVal(md5, 'title', val + ext)
            
        })
    })

})()