g_style.addStyle(`viewer`, `
    .viewer-button.viewer-fullscreen {display: none}




`)


g_item.item_hidePreview = () => $('.icon_image_preview').remove()
g_item.item_showPreview = async function(md5, show = true) {
    let data = await g_data.data_getData(md5)
    let file = g_item.item_getVal('file', data)
    let dom = g_item.item_get(data.md5)

    let width = 300
    let rect = dom[0].getBoundingClientRect()
    $(`<div id="image_preview" class="position-fixed icon_image_preview" style="z-index: 99999">
        <img src="${file}" class="w-full">
     </div>`)
    .appendTo('body')
    .css(getAvailbleRect({
        width,
        left: rect.left + rect.width,
        top: rect.top + rect.height / 2,
    }, document.body.getBoundingClientRect()))
    .on('mouseout', e => g_item.item_hidePreview())
}

// g_plugin.registerEvent('item_unpreview', () => g_item.item_hidePreview())

g_preview.register(g_format.getCategory('image'), {
    onPreview(ev) {
        let { data, dom } = ev
        let md5 = data.md5
        g_item.item_hidePreview()
        let classes = 'position-absolute bottom-0 end-0 icon_image_preview'
        $(`
            <i class="ti ti-zoom-in text-light ${classes}"></i>
            <a id="btn_image_preview" class="${classes}" style="width: 0;height: 0;line-height: 0;font-size: 0;border: 14px solid transparent;border-right-color: rgba(0, 0, 0, .2);border-bottom-color: rgba(0, 0, 0, .2);"></a>
        `)
            .insertAfter(dom)
            .on('mouseenter', e => g_item.item_showPreview(md5, true))
            .on('mouseleave', e => {
                // 弹出的图片可能会覆盖入口图标
                if(!$(e.relatedTarget).parents('#image_preview').length){
                    g_item.item_hidePreview()
                }
            })
    },
    onFullPreview(ev) {
        let { file, format, data, dom, opts } = ev
        ev.html = `
            <img src="${file}" class="h-full" hidden>
        `
        ev.cb = modal => {
            g_preload.check('viewer', () => {
                let div = modal.find('img')
                // TODO 侧边展示图片列表
                div.viewer({
                    inline: true,
                    navbar: false,
                    viewed: function() {

                    }
                })
            })
        }
    }
})

