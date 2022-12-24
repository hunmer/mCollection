var g_clips = {
    init() {
        const self = this
        g_hotkey.hotkey_register({
            'alt+digit5': {
                title: '裁剪列表',
                content: "doAction('clip_list')",
                type: 2,
            },
        })

        g_style.addStyle('clips', `
            .item_previewing video {
                z-index: 2;
                object-fit: cover;
            }
            .item_previewing > .hideOnPreview {
                display: none !important;
            }
        `)

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

        // 删除文件时同时删除裁剪文件
        g_plugin.registerEvent('files_remove', ({ key, d }) => {
            self.removeDir(key)
        })

        g_action.registerAction({
            item_preview(dom) {
                doAction('item_unpreview')
                let par = $(dom).parents('[data-file]').addClass('item_previewing')
                let file = par.attr('data-file')
                let div = $(`
                    <div id="video_item_preview" class="position-relative p-0 m-0">
                        <video src="${file}" class="w-full" autoplay onclick="toggleVideoPlay(this)" data-out="item_unpreview" height="${dom.height}px" width="${dom.width}px"></video>
                        <div class="progress position-absolute bottom-0 w-full" style="height: 3px; pointer-events: none;">
                          <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
                        </div>
                        <span class="badge position-absolute end-0 top-0">
                            00:00:00
                        </span>
                    </div>
                `).insertBefore(dom);

                let video = div.find('video')
                video[0].addEventListener('timeupdate', function(e) {
                    div.find('.badge').html(getTime(this.currentTime))
                    div.find('.progress-bar').css('width', (this.currentTime / this.duration * 100).toFixed(1) + '%')
                })
                setTimeout(() => {
                    let last = 0
                    video.
                    on('mousemove', function(e) {
                        let pos = e.originalEvent.offsetX / $(this).width();
                        if (Math.abs(last - pos) >= 0.005) {
                            video[0].currentTime = video[0].duration * pos
                        }
                        last = pos
                    }).
                    on('ended', e => video[0].playbackRate = 1).
                    on('mouseleave', e => doAction('item_unpreview')).
                    on('mousewheel', function(e) {
                        e = e.originalEvent
                        if (e.ctrlKey) {
                            video[0].playbackRate += e.deltaY > 0 ? -0.1 : 1;
                        }
                    })
                }, 750) // 延迟绑定

            },
            item_unpreview() {
                $('.item_previewing').removeClass('item_previewing').find('#video_item_preview').remove()
            },
            clips_checkClips() {
                let md5 = self.currentMd5
                let clips = copyObj(self.getData(md5))
                let cnt = 0
                const next = () => {
                    let clip = clips.shift()
                    if (!clip) return toast(cnt ? '成功补全' + cnt + '个片段!' : '没有片段被恢复', cnt ? 'success' : 'primary')
                    let input = g_files.get(md5).file
                    let video = self.getClipFile('video', clip, md5)
                    if (!nodejs.files.exists(video)) {
                        g_cut.cutVideo(input, clip, err => {
                            if (!err) {
                                cnt++
                                next()
                            }
                        })
                    } else {
                        next()
                    }
                }
                next()
                g_menu.hideMenu('files_item')
            },
            clips_clear() {
                confirm('确定要清空所有片段嘛?', { title: '清空片段', type: 'danger' }).then(() => {
                    self.clearClips()
                    self.data = []
                    toast('成功清空所有片段!', 'success')
                })
            },
            clips_export() {
                let files = {}
                self.data.forEach(clip => {
                    // TODO 获取所有片段文件函数
                    let file = self.getClipFile('video', clip)
                    if (nodejs.files.exists(file)) files[file] = getFileName(file)
                })
                if (!Object.keys(files).length) return toast('没有任何文件!', 'danger')
                g_form.confirm1({
                    elements: {
                        fileName: {
                            title: '文件名称(打包模式生效)',
                            value: 'videos_' + (new Date().format('yyyy_MM_dd_hh_mm_ss')) + '.zip',
                        },
                        saveTo: {
                            title: '导出位置',
                            type: 'file_chooser',
                            required: true,
                            value: 'C:\\Users\\31540\\Desktop',
                            opts: {
                                title: '选择目录',
                                properties: ['openDirectory'],
                            }
                        },
                        zip: {
                            title: '打包',
                            type: 'checkbox',
                        },
                    },
                    title: '导出片段',
                    btn_ok: '导出',
                    callback({ vals }) {
                        if (vals.zip) {
                            ipc_send('saveAsZip', Object.assign(vals, { files }));
                        } else {
                            for (let [file, name] of Object.entries(files)) {
                                nodejs.files.copySync(file, vals.saveTo + '\\' + name)
                            }
                            toast('导出成功!', 'success')
                        }
                    }
                })
            },
            clips_archive() {
                if (!self.data.length) return
                let md5 = self.currentMd5
                // TODO files.js注册入口
                if (!md5) return toast('只有本地文件才能封存', 'danger')

                let path = 'Z:\\片段备份\\' + md5 + '\\'
                // let saveTo = getConfig('clips_saveTo')
                // if(isEmpty(saveTo))
                confirm('确定要封存数据嘛?', { title: '封存数据', type: 'danger' }).then(async () => {
                    // TODO 自定义备份目录
                    // TODO 是否要移动片段和封面选项
                    let from = self.getClipFile() + md5 + '\\'
                    let move = await confirm('是否移动媒体数据?').catch(err => console.log(err)) // 不加catch的话,promise调用reject会报错...
                    nodejs.files.write(path + 'clips.json', JSON.stringify({
                        md5,
                        file: self.currentFile,
                        clips: self.data,
                    }))
                    move && nodejs.fs.moveSync(from, path)
                    g_files.remove(md5)
                    toast('成功封存!', 'success')
                })
            }
        })

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
                    self.removeClip(clip)
                    self.saveData()
                    break
            }
            g_menu.hideMenu('clip_item')
        })

        g_action.registerAction({
            clip_list: dom => {
                g_detailTabs.tabs.tab_ative('clips')
            },
            clip_click(dom, a, e) {
                g_player.getPlayer().setCurrentTime(dom.dataset[e.altKey ? 'end' : 'start'])
            },
            clip_dbclick: dom => {
                let { start, end } = dom.dataset
                g_plugin.callEvent('loadClip', { clip: self.findClip({ start, end }, 'find') }).then(() => {
                    self.currentClip = { start, end }
                    g_cut.setInputs(copyObj(self.currentClip))
                    self.toggleSelected(dom)
                })
            }
        })
    },

    // 删除目录
    removeDir(md5) {
        nodejs.files.removeDir(this.getClipFile() + md5 + '\\')
        nodejs.files.remove(this.getDataFile(md5))
        if (key == this.currentMd5) {
            setConfig('lastPlay', '')
            this.reset()
        }
    },

    // 获取选中
    getSelected() {
        return $('.clip .card.bg-primary-lt')
    },

    // 切换选中
    toggleSelected(dom) {
        this.getSelected().removeClass('bg-primary-lt')
        dom && $(dom).addClass('bg-primary-lt')
    },

    // 移除片段
    removeClip(clip, data) {
        nodejs.files.remove(this.getClipFile('video', clip))
        nodejs.files.remove(this.getClipFile('cover', clip))
        let find = this.findClip(clip)
        if (find != -1) {
            (data || this.data).splice(find, 1)
        }
        this.getItem(clip).remove()
    },

    // 清空片段
    clearClips(md5) {
        let data = this.getData(md5)
        data.forEach(clip => this.removeClip(clip, data))
        this.saveData([], md5)
        this.refresh()
    },

    // 重置所有片段
    reset() {
        delete this.currentFile
        delete this.currentMd5
        delete this.currentClip
        this.data = []
        this.refresh()
    },

    // 加载视频片段
    loadClips(file) {
        let md5 = nodejs.files.getMd5(file)
        let data = this.getData(md5)
        g_plugin.callEvent('loadClips', { file, md5, data }).then(({ file, md5, data }) => {
            this.currentFile = file
            this.currentMd5 = md5
            this.data = data
            this.refresh()
        })
    },

    getDataFile(md5) {
        return this.getClipFile('data') + (md5 || this.currentMd5) + '.json'
    },

    getData(md5) {
        let file = this.getDataFile(md5)
        return nodejs.files.exists(file) ? JSON.parse(nodejs.files.read(file)) : []
    },

    saveData(d, md5) {
        if (!md5) md5 = this.currentMd5
        let file = this.getDataFile(md5)
        let data = copyObj(d || this.data)
        if (md5 == this.currentMd5) this.data = data

        nodejs.files[data.length == 0 ? 'remove' : 'write'](file, JSON.stringify(data))
        g_plugin.callEvent('clipsSaved', { md5, data })
    },

    // 设置片段状态文本
    setStatus({ start, end }, text, style = 'warning') {
        let div = this.getItem(start, end)
        replaceClass(div.find('.ribbon').toggleClass('hide', text == '').html(text), 'bg-', 'bg-' + style)
    },

    getItem(start, end) {
        if (typeof(start) == 'object') {
            var { start, end } = start
        }
        return getEle({ start, end }).parents('.clip')
    },

    // 获取片段文件
    getClipFile(type, clip, md5) {
        if (!md5) md5 = this.currentMd5
        let folder = __dirname + '\\cut\\'
        if (type) {
            if (type != 'data') folder += md5 + '\\'
            folder += type + '\\'
        }
        if (clip) folder += `${clip.start} - ${clip.end}` + (type == 'cover' ? '.jpg' : '.mp4')
        return folder
    },

    // 设置片段展示封面
    setCover({ start, end }, img) {
        this.getItem(start, end).find('img').attr('src', img)
    },

    refresh() {
        if (this.data) {
            let h = ''
            this.data.sort((a, b) => {
                return a.start - b.start // 按照起点排序
            }).forEach(clip => {
                h += this.parseClip(clip)
            })
            $('#tab_clips').html(`<div class="row p-2">${h}</div>`)
            this.update()
        }
    },

    update() {
        $('#clip_cnt').html(this.data.length)
    },

    findClip(clip, method = 'findIndex') {
        return this.data[method](item => item.start == clip.start && item.end == clip.end)
    },

    // 添加片段
    addClip(clip) {
        let find = this.findClip(clip)
        let current = this.currentClip
        if (find != -1 && !current) return toast('片段已经存在!', 'danger')
        g_plugin.callEvent('addClip', { clip }).then(({ clip }) => {
            let h = this.parseClip(clip)
            if (current) {
                find = this.findClip(current)
                delete this.currentClip
                this.getItem(current.start, current.end).replaceWith(h)
            } else
            if (find == -1) {
                find = this.data.length
                $('#tab_clips .row').append(h)
            }
            this.data[find] = clip
            this.saveData()

            $('input:focus').blur()
            this.update()
            this.toggleSelected()
        })
    },

    // 获取片段结构
    parseClip(v) {
        let cover = g_clips.getClipFile('cover', v)
        if (!nodejs.files.exists(cover)) cover = 'res/loading.gif'
        let file = g_clips.getClipFile('video', v)
        let tags = v.tags && v.tags.length ? v.tags : ['无标签']
        return `
                <div class="clip col-6 mt-2">
                    <div class="card h-fit position-relative" data-icon="${cover}" data-file="${file}" draggable="true" data-action="clip_click" data-dbclick="clip_dbclick" data-start=${v.start} data-end=${v.end}>
                      <img class="w-full hideOnPreview" height="120" style="object-fit: cover" src="${cover}" data-hover="item_preview" data-hoverTime="500">
                      <div class="ribbon bg-red hide"></div>
                      <span class="badge bg-primary position-absolute top-0 end-0 hideOnPreview">${getTime(v.start) + '-' + getTime(v.end)}</span>
                      <div class="card-body">
                        <h3 class="card-title">${tags.join(',')}</h3>
                      </div>
                    </div>
                  </div>
            `
    },
}

g_detailTabs.register('clips', {
    onTabChanged: tab => {
        g_clips.refresh()
    },
    onVideoEvent: (type, { tab }) => {
        if (type == 'show') {
            g_clips.loadClips(g_videoTabs.getTabValue('value', tab))
        }
    },
    tab: {
        id: 'clips',
        title: '<i class="ti ti-movie fs-2"></i><span class="badge bg-danger ms-2" id="clip_cnt">0</span>',
        html: `
            <div class="position-relative h-full">
                <div class="overflow-y-auto overflow-x-hidden" id="tab_clips" style="height: calc(100vh - 100px)" data-out="item_unpreview" data-outfor="item_preview">
                </div>
                <div class="position-absolute left-0 bottom-0 w-full btn-group" style="height: 35px;">
                    <a href="#" class="btn btn-icon" aria-label="Button" data-action="clips_archive" title="封存">
                        <i class="ti ti-archive fs-2"></i>
                    </a>
                    <a href="#" class="btn btn-icon" aria-label="Button" data-action="clips_export" title="导出">
                        <i class="ti ti-file-export fs-2"></i>
                    </a>
                    <a href="#" class="btn btn-icon" aria-label="Button" data-action="clips_checkClips" title="检查丢失">
                        <i class="ti ti-zoom-question fs-2"></i>
                    </a>
                    <a href="#" class="btn btn-icon" aria-label="Button" data-action="clips_clear" title="清空">
                        <i class="ti ti-trash text-danger fs-2"></i>
                    </a>
                </div>
            </div>
            `
    },
}, g_clips)

// 本地文件转FILE://
function formatBackgroundURL(img) {
    if (!img.startsWith('.')) {
        img = 'file:\\' + img
    }
    return replaceAll_once(img, '\\', '\\\\')
}