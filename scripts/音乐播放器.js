// ==UserScript==
// @name    音乐播放器
// @version    0.0.1
// @author    hunmer
// @icon      music:red
// @description    为音频素材提供音乐播放器的样式以及一些其他功能
// @updateURL    
// @primary    1
// @namespace    5be4f86d-9f9d-4029-97d2-367ace6257c2

// ==/UserScript==

(() => {

    // 设置歌词存储规则
    g_item.setItemType('lyric', {
        initFile: args => args.lyric = args.path + 'default.lrc',
        // initFile: args => args.lyric = g_db.opts.path + '/lyric/' + args.data.md5 + '.lrc',
        getFile: args => args.lyric,
        beforeCheck: () => { },
    })

    g_setting.setDefault({
        music_volume: 100,
        miniPlayer: true,
    })

    // 导入音频同时导入歌词
    g_plugin.registerEvent('db_afterInsert', async ({ opts, ret, method }) => {
        let { table, data } = opts
        if (ret.lastInsertRowid > 0  && method == 'insert' && table == 'files' && g_format.getFileType(data.title) == 'audio') {
            let lrc = getFilePath(data.file) + getFileName(data.title, false) + '.lrc'
            if(nodejs.files.exists(lrc)){
                let saveTo = await g_item.item_getVal('lyric', data)
                nodejs.files.copy(lrc, saveTo)
            }
        }
    })
    
    g_setting.tabs.plugins.elements['miniPlayer'] = {
        title: '开启迷你播放器',
        type: 'switch',
        value: () => getConfig('miniPlayer'),
    }

    if(getConfig('miniPlayer')){
        const getMiniPlayer = (remove = false) => insertEl(
            {tag: 'div', text: '', props: { id: 'music_mini', class: 'w-full datalist-item'}},
            {target: $('#accordion-group'), method: 'appendTo', remove}
        ).html(`
        <div class="w-full position-relative">
            <img class="w-full" data-dbclick="preview_toggleFullPreview" src="./res/cover.jpg">
            <div class="position-absolute top-5 end-5">
                <a class="btn btn-pill opacity-75 " data-action="preview_unFullPreview" title="关闭" >
                    <i class="ti ti-x"></i>
                </a>
            </div>
            <div class="w-full text-center position-absolute bottom-10" id="music_mini_btns">
                <a class="btn btn-pill opacity-75 " data-action="music_prev" title="上一首" >
                    <i class="ti ti-player-track-prev-filled"></i>
                </a>
                <a class="btn btn-pill opacity-75" data-action="music_toggle" title="暂停" >
                    <i class="ti ti-player-pause-filled"></i>
                </a>
                <a class="btn btn-pill opacity-75" data-action="music_next" title="下一首" >
                    <i class="ti ti-player-track-next-filled"></i>
                </a>
            </div>
        </div>`)
    
        g_plugin.registerEvent('item_fullPreview', async ({data}) => {
            let mini = getMiniPlayer()
            let isAudio = g_format.getFileType(data.file) == 'audio'
            let exists = isAudio && data.cover.endsWith('cover.jpg')
            mini
            .toggleClass('hide', !isAudio)
            .attr('data-md5', data.md5)
            .find('img').attr('src', exists ? data.cover : './res/cover.jpg')
        })
    
        g_plugin.registerEvent('item_unFullPreview', () => getMiniPlayer(true))
    }

    g_setting.onSetConfig({
        music_volume: v => g_preview.video.volume = v / 100,
        music_autoNext: v => getEle('music_autoNext').find('i').replaceClass('ti-', 'ti-player-skip-forward'+ (v ? '-filled' : ''))
    })

    g_action.registerAction({
        music_prev: () => g_preview.item_next(-1),
        music_next: () => g_preview.item_next(1),
        music_toggle: () => g_preview.togglePlay(),
        music_autoNext: () => g_setting.toggleValue('music_autoNext'),
        range_music: dom => g_preview.video.currentTime = dom.value,
    })

    g_preview.register([...g_format.getCategory('audio')], {
        async onFullPreview(ev) {
            let {data, file, format, md5} = ev
            let path = g_db.getSaveTo(md5)
            let waveFile = path+'wave.png'
            let coverFile = path+'cover.jpg'
            if(!nodejs.files.exists(coverFile)) coverFile = './res/cover.jpg'
            let meta = JSON.parse((await g_detail.inst?.exif?.get(data.id)) || "{}")
            // TODO 如果封面不存在
            ev.html = `
                <audio src="${file}" autoplay></audio>
                <div class="row w-full h-full m-0">
                    <div class="col mb-3">
                        <div class="h-full d-flex flex-wrap justify-content-between align-content-center">
                            <div class="col-12 text-center mb-3" style="height: calc(100vh - 400px)">
                                <img class="h-full border rounded-3" src="${coverFile}">
                            </div>
                            <div class="col-12 text-center">
                                <p>${meta.Title ?? data.title}</p>
                                ${meta.Album ? `<p>${meta.Album}(${meta.Artist})</p>` : ''}
                            </div>
                            ${nodejs.files.exists(waveFile) ? `
                            <div class="col-12 text-center mb-3">
                                <img class="w-full" src="${waveFile}" style="height: 90px;" id="audio_wave">
                                <input data-input="range_music" id="audio_progress" type="range" class="form-range w-full" value="0" max="100" step="1" />
                            </div>
                            ` : ''}
                            
                            <div class="col-12 text-center" id="music_btns">
                                <a class="btn btn-pill btn-ghost-secondary btn-lg" data-action="music_prev" title="上一首" >
                                    <i class="ti ti-player-track-prev-filled"></i>
                                </a>
                                <a class="btn btn-pill btn-ghost-primary btn-lg" data-action="music_toggle" title="暂停" >
                                    <i class="ti ti-player-pause-filled"></i>
                                </a>
                                <a class="btn btn-pill btn-ghost-secondary btn-lg" data-action="music_next" title="下一首" >
                                    <i class="ti ti-player-track-next-filled"></i>
                                </a>
                                <div class="dropdown d-inline">
                                    <a class="btn btn-pill btn-ghost-warning btn-lg" data-bs-toggle="dropdown" title="音量" data-bs-offset="0,10">
                                        <i class="ti ti-volume"></i>
                                    </a>
                                    <div class="dropdown-menu p-2">
                                        <input id="music_volume" type="range" class="form-range w-full" value="100" max="100" step="1">
                                    </div>
                                </div>
                                <a class="btn btn-pill btn-ghost-success btn-lg" data-action="dropdown_show,preview_list" title="播放列表">
                                    <i class="ti ti-playlist" ></i>
                                </a>
                                <a class="btn btn-pill btn-ghost-info btn-lg" data-action="music_autoNext" title="自动下一首">
                                    <i class="ti ti-player-skip-forward-filled" ></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col col-xl-4 col-md-5  overflow-y-auto" style="height: calc(100% - 50px);" id="preview_tabs"></div>
                </div>
            `
            ev.cb = async modal => {
                let audio = g_preview.video = modal.find('audio')[0]

                // LRC转TextTrack
                let lrcFile = await g_item.item_getVal('lyric', md5)
                let lrcs = parseLrc(nodejs.files.read(lrcFile, ''))
                if(lrcs.length){
                    let track = audio.addTextTrack('captions');
                    lrcs.map(({time, text}, i) => {
                        let end = ++i != lrcs.length ? lrcs[i].time : time + 30
                        track.addCue(new VTTCue(time, end, text));
                    })
                }
                
                let volume = $('#music_volume')
                let progress = $('#audio_progress')
                const setPaused = b => getEle('music_toggle').find('i').replaceClass('ti-', 'ti-player-'+ (b ? 'play' : 'pause'))
                audio.addEventListener('durationchange', e => progress.attr('max', audio.duration))
                audio.addEventListener('pause', e => setPaused(true))
                audio.addEventListener('play', e => setPaused(false))
                audio.addEventListener('ended', e => getConfig('music_autoNext') && doAction('music_next'))
                audio.addEventListener('timeupdate', e => progress.val(audio.currentTime))
                audio.addEventListener('volumechange', e => volume.val(audio.volume * 100))
                volume.on('input', e => setConfig('music_volume', volume.val(), 100))
                $('#audio_wave').on('click', function(e) {
                    let pos = e.originalEvent.offsetX / $(this).width();
                    audio.currentTime = audio.duration * pos
                })
                g_setting.apply(['music_volume', 'music_autoNext'])
            }
        }
    })

    const parseLrc = lrc => {
        let ret = []
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{1,3})\]/g;
        lrc.split("\n").forEach(line => {
            let match = timeRegex.exec(line);
            if (match) {
                let time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 1000;
                let text = line.replace(timeRegex, "").trim();
                ret.push({ time, text });
            }
        })
        return ret
    }

})()

