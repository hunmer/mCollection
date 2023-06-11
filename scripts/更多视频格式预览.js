// ==UserScript==
// @name    更多视频格式预览
// @version    0.0.1
// @author    hunmer
// @description  简单的支持预览更多格式的视频和音频
// @primary    1
// @namespace    00035f82-8145-4bec-aca7-44a10d8138d1

// ==/UserScript==

(() => {
    var proc
    const startSever = () => {
        proc = nodejs.cli.run(_dataPath + '/node/node', __dirname + '/server/mediaServer.js', {}, {
            onOutput: function(msg) {
                console.log(msg)
            },
            onExit: () => {}
        })
       }

    fetch('http://127.0.0.1:3001').then(response => response.json()).then(data => {
        if (data.status != 'success') {
            startSever()
        }
    }).catch(error => {
        startSever()
    });

    g_plugin.registerEvent('item_preview', async args => {
        const cb = async _type => {
            args.opts.isLive = true // 直播标识

            let div = new DOMParser().parseFromString(await toVal(args.html), 'text/html')
            let el = div.querySelector('video')
            if(el){
                el.src = 'http://127.0.0.1:3001/'+_type+'?file='+file
                args.html = div.body.innerHTML
            }
        }
        
        let {file} = args.data
        let type = g_format.getFileType(file)
        let ext = getExtName(file)
        if(type == 'video'){
            if(!['ogv', 'mkv', 'm4v', 'f4v', '3gp', 'webm', 'mp4', 'mov'].includes(ext)){
                await cb('video')
            }
        }else
        if(type == 'audio'){
            if(!['aac', 'amb', 'flac', 'm4a', 'm4r', 'oga', 'ogg', 'opus', 'wav', "mp3"].includes(ext)){
                await cb('audio')
            }
        }
    }, -1)
})()
