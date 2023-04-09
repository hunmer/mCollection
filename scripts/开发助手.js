// ==UserScript==
// @name    开发助手
// @version    1.0
// @author    hunmer
// @description    一些便利功能
// @namespace    72a45071-9af7-4c6c-8c3b-454d80039af0
// ==/UserScript==

({
    init() {
        const self = this
       $(`
           <i class="ti ti-icons fs-2" data-action="icon_test" title="图标"></i>
           <i class="ti ti-trash text-danger fs-2" data-action="db_clear" title="清空数据库"></i>
        `).appendTo('#icons_left')

    },
}).init()
