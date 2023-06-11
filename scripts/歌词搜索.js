// ==UserScript==
// @name    歌词搜索
// @version    1.0
// @author    hunmer
// @icon      search:blue
// @updateURL    https://neysummer2000.fun/mCollection/scripts/歌词搜索.js
// @description    歌词搜索以及写入封面数据
// @namespace    db9777a7-7a9e-420d-9cec-9661fa4bc7cf

// ==/UserScript==


(() => {
    var _targetMD5
    const _server = 'http://127.0.0.1/musicAPI/'
    const _http = (url, data) => {
        return new Promise((reslove, reject) => {
            $.getJSON(_server+url, data, (ret, textStatus) => {
                if(textStatus == 'success') return reslove(ret)
                reject()
            })
        })
    }
    const _search = keyword => _http('?&type=search&name='+keyword)

    g_plugin.registerEvent('item_fullPreviewed', async () => {
       let lrc = await g_item.item_getVal('lyric', g_preview.previewing.data.data)
        if(!nodejs.files.exists(lrc)){
            g_preview.tabs.getContent('subtitle').html('<button class="btn btn-primary mt-3" data-action="lyric_search"><i class="ti ti-search me-2"></i>搜索字幕</button>')
        }
    })

    g_action.registerAction({
        lyric_search(){
            toast('正在搜索歌曲中...')
            let {title, md5} = g_preview.previewing.data.data
            prompt(getFileName(title, false)).then(_title => {
                _targetMD5 = md5
                _search(_title).then(data => {
                    let items = data.splice(0, 10).map(({album, artist, lyric_id, name, pic_id, source}, i) => {
                        return {
                            props: `data-action="lyric_fetch" data-lyric="?&type=lyric&id=${lyric_id}" `,
                            row: [i+1, `<img src="${_server+'?&type=cover&id='+pic_id}" class="lazyload w-full">`, name, artist.join('&'), album],
                        }
                    })
                    g_modal.modal_build({
                        id: 'lyric_search',
                        html: g_tabler.build_table({
                            items,
                            headers: [{title: '*'}, {title: '封面'}, {title: '歌名'}, {title: '歌手'}, {title: '专辑'}],
                        }),
                        title: '歌词搜索',
                        width: '80%',
                        scrollable: true,
                    })
                })
            })
        },
        lyric_fetch(dom){
            // toast('正在获取歌词中...')
            _http(dom.dataset.lyric).then(({lyric, tlyric}) => {
                const writeLyric = async content => {
                     nodejs.files.write(await g_item.item_getVal('lyric', _targetMD5), content)
                     // TODO 刷新歌词
                     g_modal.remove('lyric_fetch')
                     g_modal.remove('lyric_search')
                     g_preview.isPreviewing() && g_preview.item_next(0)
                     toast('保存歌词成功')
                }
                g_modal.modal_build({
                    id: 'lyric_fetch',
                    html: `
                    <div class="row w-full">
                        <div class="col-6">
                            <textarea class="form-control" rows="20" placeholder="歌词" readonly>${lyric}</textarea>
                        </div>
                        <div class="col-6">
                            <textarea class="form-control" rows="20" placeholder="翻译" readonly>${tlyric}</textarea>
                        </div>
                    </div>
                    `,
                    width: '80%',
                    title: '歌词展示',
                    scrollable: true,
                    buttons: [{
                        text: '仅保存歌词',
                        onClick: () => writeLyric(lyric)
                    }, {
                        text: '仅保存翻译',
                        onClick: () => writeLyric(tlyric)
                    }, {
                        text: '合并保存',
                        onClick: () => writeLyric(lyric+tlyric)
                    }],
                })
            })
        }
    })

})()