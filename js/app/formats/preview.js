$(function() {
    g_plugin.registerEvent('onBeforeShowingDetail', ({ items, columns }) => {
        if (items.length == 1) {
            columns.preview = {
                html: d => `
                    <div class="text-center d-block">
                      <img data-action="detail_image" src="${g_item.item_getVal('cover', d)}" alt="${d.title}" class="rounded p-1" style="max-height: 300px;">
                    </div>
                `
             }
        }
    })
})