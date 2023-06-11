// ==UserScript==
// @name    拖动文件后自动隐藏
// @version    0.0.1
// @author    hunmer
// @description    适合短视频工作者,需在设置显示应用快捷键
// @updateURL   https://neysummer2000.fun/mCollection/scripts/拖动文件后自动隐藏.js
// @primary    1
// @namespace    b0b661c3-cea1-4a39-9bd9-991e6629d2f8

// ==/UserScript==

$(function () {
    g_setting.tabs.plugins.elements['hideAfterDraged'] = {
        title: '拖动片段自动隐藏窗口',
        type: 'switch',
        value: () => getConfig('hideAfterDraged', false),
    }
    g_plugin.registerEvent('beforeDragingFile', ({ keys }) => {
        // todo 判断是否拖动到任务栏....
        keys.length && getConfig('hideAfterDraged') && ipc_send('hide')
    })
});
