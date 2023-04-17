(() => {

    g_plugin.registerEvent('onBeforeShowingDetail', ({ columns }) => {
            columns.preview = {
                multi: true,
                html(items){
                    let h = ''
                    let i = 0
                    let cnt = items.length
                    items.slice(0, 4).forEach(item => {
                        i++
                        h += `<img data-action="detail_image" src="${g_item.item_getVal('cover', item)}" alt="${item.title}" class="rounded p-1 col-${i != cnt ? 6 : (i % 2 == 0 ? 6 : 12)}">`
                    })
                    return `
                    <div class="row m-0 p-0">${h}</div>`
                }
             }
    })
})()