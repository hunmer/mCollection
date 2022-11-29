let _inst = () => g_detailTabs.instance.clips.inst
g_detailTabs.register('clips', {
    onTabChanged: tab => {
        _inst().refresh()
    },
    onVideoEvent: (type, { tab }) => {
        if (type == 'show') {
            _inst().loadClips(g_videoTabs.getTabValue('folder', tab))
        }
    },
    tab: {
        id: 'clips',
        title: '<i class="ti ti-movie fs-2"></i><span class="badge bg-danger ms-2" id="clip_cnt">0</span>',
        html: `
            <div class="overflow-y-auto h-full" id="tab_clips" style="padding-bottom: 50px">
            </div>
            `
    },
}, {
    init() {
        const self = this
        window.g_clips = self
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
                return dom.data('start') + '-' + dom.data('end')
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
            let id = getParentAttr(g_menu.target, 'data-id')
            let [start, end] = g_menu.key.split('-')
            let clip = { start, end, time: end - start }
            let file = g_clips.getClipFile('video', clip)
            switch (action[0]) {
                case 'clip_item_file':
                    ipc_send('openFolder', file)
                    break
                case 'clip_item_play':
                    nodejs.files.openFile(file);
                    break
                case 'clip_item_cut':
                    g_cut.cutVideo(g_player.getPlayer().getURL(), clip)
                    break
                case 'clip_item_delete':
                    nodejs.files.remove(file)
                    g_menu.target.remove()
                    break
            }
            g_menu.hideMenu('clip_item')
        })

        g_action.registerAction({
            clip_list: dom => {
                g_detailTabs.tabs.tab_ative('clips')
            },
            clip_click: dom => {
                g_player.getPlayer().setCurrentTime(dom.dataset.start)
            },
            clip_dbclick: dom => {
                let { start, end } = dom.dataset
                dom = $(dom)
                $('.clip .card.bg-primary-lt').removeClass('bg-primary-lt')
                dom.addClass('bg-primary-lt')

                self.currentClip = { start, end}
                g_cut.setInputs(self.currentClip)
            }
        })
    },

    // 获取本地片段
    getClips(folder) {
        return new Promise(reslove => nodejs.files.dirFiles(folder, ['mp4'], files => {
            reslove({
                folder,
                files: files.map(file => getFileName(file, false))
            })
        }))
    },

    // 加载视频片段
    loadClips(folder) {
        this.currentFolder = folder + '裁剪片段\\'
        this.refresh()
    },

    // 设置片段状态文本
    setStatus({ start, end }, text, style = 'warning') {
        let div = getEle({ start, end })
        replaceClass(div.find('.ribbon').toggleClass('hide', text == '').html(text), 'bg-', 'bg-' + style)
    },

    // 获取片段文件
    getClipFile(type, clip, folder) {
        if (isEmpty(folder)) folder = this.currentFolder
        if (type) folder += type + '\\'
        if (clip) folder += `${clip.start} - ${clip.end}` + (type == 'cover' ? '.jpg' : '.mp4')
        return folder
    },

    // 设置片段展示封面
    setCover({ start, end }, img) {
        getEle({ start, end }).find('.card-img-top').css('backgroundImage', 'usnet').css('backgroundImage', `url('${formatBackgroundURL(img)}')`)
    },

    refresh() {
        this.currentFolder && this.getClips(this.currentFolder).then(list => this.showClips(list))
    },

    // 添加片段
    addClip(clip) {
        $('#tab_clips .row').append(this.parseClip(clip))
    },

    // 获取片段结构
    parseClip(v, folder) {
        let cover = folder ? g_clips.getClipFile('cover', v, folder) : 'res/loading.gif'
        let file = folder ? g_clips.getClipFile('video', v, folder) : ''
        return `
                <div class="clip col-6 mt-2">
                    <div class="card h-fit" data-icon="${cover}" data-file="${file}" draggable="true" data-action="clip_click" data-dbclick="clip_dbclick" data-start=${v.start} data-end=${v.end}>
                      <div class="card-img-top img-responsive img-responsive-21x9" style="background-image: url('${formatBackgroundURL(cover)}')"></div>
                      <div class="ribbon bg-red hide"></div>
                      <div class="card-body">
                        <h3 class="card-title">${getTime(v.start) + '-' + getTime(v.end)}</h3>
                      </div>
                    </div>
                  </div>
            `
    },

    // 展示片段数据
    showClips(d) {
        let h = ''
        d.files.forEach(k => {
            let a = k.split(' - ')
            h += this.parseClip({ start: a[0], end: a[1] }, d.folder)
        })
        $('#tab_clips').html(h ? `<div class="row p-2">${h}</div>` : `
            <h4 class="text-center">这里空空如也...</h4>
        `)
        $('#clip_cnt').html(d.files.length)
    },
})

// 本地文件转FILE://
function formatBackgroundURL(img) {
    if (!img.startsWith('.')) {
        img = 'file:\\' + img
    }
    return replaceAll_once(img, '\\', '\\\\')
}