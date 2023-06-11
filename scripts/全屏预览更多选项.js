// ==UserScript==
// @name    全屏预览更多选项
// @version    1.0
// @author    hunmer
// @description    全屏预览更多选项
// @icon      search:blue
// @updateURL    https://neysummer2000.fun/mCollection/scripts/全屏预览更多选项.js
// @namespace    db9777a7-7a9e-420d-9cec-9661fa4bc7cf

// ==/UserScript==


(() => {
    g_plugin.registerEvent('item_fullPreviewed', ({ modal, data }) => {
        if(getFileType(data.file) != 'image') return

        let header = $('#fullPreview_header')
        let content = modal.find('.modal-content')
            .css('backgroundColor', getConfig('fullPreview_trans') ? 'transparent' : '');

        if (getConfig('fullPreview_hideHeader')) {
            let header_h = header.height()
            content.on('mousemove', e => {
                let { screenX, screenY } = e
                header.toggleClass('hide1', screenY > header_h)
            })
        }
    })
    Object.assign(g_setting.tabs.sample.elements, {
        fullPreview_trans: {
            title: '全屏预览背景透明',
            type: 'switch',
            value: () => getConfig('fullPreview_trans')
        },
        fullPreview_hideHeader: {
            title: '全屏预览隐藏顶部按钮',
            type: 'switch',
            value: () => getConfig('fullPreview_hideHeader')
        },
    })
})()