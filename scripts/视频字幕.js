// ==UserScript==
// @name    视频字幕
// @version    0.0.1
// @author    hunmer
// @description    为视频添加字幕支持
// @updateURL    
// @primary    1
// @updateURL   https://neysummer2000.fun/mCollection/scripts/视频字幕.js
// @namespace    78d028ac-23e5-45ad-9a2c-46313445d35a

// ==/UserScript==

(() => {
    // 设置字幕存储规则
    g_item.setItemType('subtitle', {
        initFile: args => {
            args.subtitle = nodejs.path.resolve(g_db.opts.path+'\\folders\\', `../subtitle/${args.data.md5}.vtt`)
        },
        beforeCheck: () => {},
        getFile: args => args.subtitle,
    })

    // 视频字幕标识

    // 侧边字幕信息
    g_plugin.registerEvent('onBeforeShowingDetail', async ({ items, columns }) => {
        if(!columns.status || items.length != 1) return
        let subtitle = await g_item.item_getVal('subtitle', items[0])
        let content = nodejs.files.read(subtitle)
        if(content){
            columns.status.list.subtitle = {
                title: '字幕',
                class: 'bg-green-lt',
                props: `data-action="openFile" data-file="${subtitle}"`,
                getVal: () => content.split(' --> ').length - 1 + '行'
            }
        }
    })

    // 播放器显示字幕
    g_plugin.registerEvent('beforePlayerInit', async ({config, ev}) => {
        console.log(config, ev)

        let url = await g_item.item_getVal('subtitle', ev.data)
        console.log(url)
        if(nodejs.files.exists(url)){
            config.subtitle = {
                url,
                type: 'webvtt',
                fontSize: '25px',
                bottom: '10%',
                color: '#b7daff'
            }
        }
    })
    
})()

