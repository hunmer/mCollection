let _inst = () => g_detailTabs.instance.clips.inst
g_detailTabs.register('clips', {
    index: 2,
    onTabChanged: old => {

    },
    onVideoEvent: (type, { tab }) => {
        console.log(type, tab)
        if (type == 'show') {
            _inst().loadClips(g_videoTabs.getTabValue('value', tab))
        }
    },
    tab: {
        id: 'clips',
        title: '<i class="ti ti-movie fs-2"></i>',
        html: `
            <div class="row overflow-y-auto h-full" id="tab_clips" style="padding-bottom: 50px">
                
            </div>
            `
    },
}, {
    init() {
        const self = this
        window.g_clips = self
        self.datas = local_readJson('clips', {})

        g_hotkey.hotkey_register({
            'alt+digit5': {
                title: '裁剪列表',
                content: "doAction('clip_list')",
                type: 2,
            },
        })

        g_menu.registerMenu({
            name: 'clip_item',
            selector: '[data-action="clip_click"]',
            dataKey(dom) {
                return dom.data('start') + '-' + dom.data('end') + '-' + dom.data('local')
            },
            html: g_menu.buildItems([{
                icon: 'cut',
                text: '裁剪',
                action: 'clip_item_cut'
            }, {
                icon: 'file',
                text: '打开文件位置',
                action: 'clip_item_file'
            }, {
                icon: 'video',
                text: '播放',
                action: 'clip_item_play'
            }, {
                icon: 'trash',
                text: '删除',
                class: 'text-danger',
                action: 'clip_item_delete'
            }])
        });

        g_action.registerAction(['clip_item_cut', 'clip_item_delete', 'clip_item_play', 'clip_item_file'], (dom, action) => {
            let [start, end, isLocal] = g_menu.key.split('-')
            isLocal = isLocal == 'true'
            let clip = { start, end, isLocal, time: end - start }

            switch (action[0]) {
                case 'clip_item_file':
                    ipc_send('openFolder', g_clips.getClipFile('video', clip))
                    break
                case 'clip_item_play':
                    nodejs.files.openFile(g_clips.getClipFile('video', clip));
                    break

                case 'clip_item_cut':
                    g_cut.cutVideo(g_episode.getPlayer().getURL(), clip)
                    break

                case 'clip_item_delete':
                    clip.remove = true
                    const callback = () => this.setClip(g_episode.currentVid, clip)
                    if (!isLocal) {
                        confirm('你确定要删除团队标记项目吗?', {
                            title: '删除标记',
                            type: 'danger'
                        }).then(() => callback())
                    } else {
                        callback()
                    }
                    break
            }
            g_menu.hideMenu('clip_item')
        })

        g_action.registerAction({
            clip_list: dom => {
                g_detailTabs.tabs.tab_ative('clips')
            },
            clip_click: dom => {
                g_episode.getPlayer().setCurrentTime(dom.dataset.start)
            },
            clip_dbclick: dom => {
                let { start, end, local } = dom.dataset
                dom = $(dom)
                $('.clip .card.bg-primary-lt').removeClass('bg-primary-lt')
                dom.addClass('bg-primary-lt')

                self.currentClip = { start, end, isLocal: local, desc: dom.find('.text-muted').text() }
                g_cut.setInputs(self.currentClip)
            }
        })
    },

    // 获取本地片段
    getClips(id, def) {
        return this.datas[id] || def
    },

    // 保存本地片段
    setClips(id, clips) {
        this.datas[id] = clips
        this.save()
    },

    // 保存片段数据
    save() {
        local_saveJson('clips', this.datas)
    },

    // 加载视频片段
    loadClips(key) { // host - id
        let clips = g_videoDatas.inst[key].get('clips', []).concat(this.getClips(key, []).map(clip => {
            clip.isLocal = true // 本地片段标识
            return clip
        }))
        this.showClips(clips)
    },

    // 设置单个片段数据
    setClip(vid, vals) {
        let index
        let { isLocal, remove } = vals
        delete vals.isLocal
        if (isLocal) { // 本地
            let clips = this.getClips(vid, [])
            index = clips.findIndex(clip => clip.start == vals.start && clip.end == vals.end)
            if (index == -1) {
                if (remove) return
                index = clips.length
            } else {
                if (remove) {
                    clips.splice(index, 1)
                    index = -1
                }
            }
            if (index >= 0) clips[index] = vals
            this.setClips(vid, clips)
        } else {
            g_videoDatas.inst[vid].setClip(vals)
        }

        delete self.currentClip
        this.loadClips(vid)
    },

    // 设置片段状态文本
    setStatus({ start, end, isLocal: local }, text, style = 'warning') {
        let div = getEle({ start, end, local })
        replaceClass(div.find('.ribbon').toggleClass('hide', text == '').html(text), 'bg-', 'bg-' + style)
    },

    // 获取片段文件
    getClipFile(type, clip, format = false) {
        let path = (clip.isLocal ? nodejs.tempPath : nodejs.dir) + 'output\\' + type + '\\'
        return path + `${clip.start} - ${clip.end}` + (type == 'cover' ? '.jpg' : '.mp4')
    },

    // 设置片段展示封面
    setCover({ start, end, isLocal: local }, img) {
        getEle({ start, end, local }).find('.card-img-top').css('backgroundImage', 'usnet').css('backgroundImage', `url('${formatBackgroundURL(img)}')`)
    },

    // 展示片段数据
    showClips(clips) {
        let h = ''
        clips.forEach(v => {
            let cover = g_clips.getClipFile('cover', v)
            h += `
                <div class="clip col-12">
                    <div class="card" data-icon="${cover}" data-file="${g_clips.getClipFile('video', v)}" draggable="true" data-action="clip_click" data-dbclick="clip_dbclick" data-start=${v.start} data-end=${v.end} data-local=${Boolean(v.isLocal)}>
                      <div class="card-img-top img-responsive img-responsive-21x9" style="background-image: url('${formatBackgroundURL(cover)}')"></div>
                      <div class="ribbon bg-red hide"></div>
                      <div class="card-body">
                        <h3 class="card-title"><span class="badge bg-${v.isLocal ? 'secondary' : 'warning'} mr-2">${v.isLocal ? '个人' : '团队'}</span>${getTime(v.start) + '-' + getTime(v.end)}</h3>
                        <p class="text-muted">${v.desc}</p>
                      </div>
                    </div>
                  </div>
            `
        })
        $('#tab_clips').html(h || `
            <h4 class="text-center">这里空空如也...</h4>
        `)
    },
})

// 本地文件转FILE://
function formatBackgroundURL(img) {
    if (!img.startsWith('.')) {
        img = 'file:\\' + img
    }
    return replaceAll_once(img, '\\', '\\\\')
}