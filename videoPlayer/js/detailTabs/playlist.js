let g_playlist = {

    // TODO 将数据写入文件夹， 支持显示本地已下载电视剧

    // 更新选中显示
    selected_update() {
        let selected = this.selected_vals()
        let i = selected.length
        getEle('playlist_download').find('.badge').toggleClass('hide1', i == 0).html(i)
        if (i == 1) { // 单个选中，则加载视频
            let { value, key: title } = selected[0]
            let folder = this.getSaveTo(this.data.title)
            let file = folder + title + '.mp4'
            const loadURL = url => g_player.newTab({ value: url, url: value, title, folder })
            if (!nodejs.files.exists(file)) {
                g_rule.url_parse(value, loadURL)
            } else {
                loadURL(file)
            }
        }
    },

    playlist_getItem(url) {
        return getEle({ value: url, action: 'playlist_item_click' })
    },

    // 返回选中
    selected_list() {
        return this.tabs.getCurrentContent().find('.btn.active')
    },

    selected_vals() {
        let r = []
        for (let d of this.selected_list()) {
            r.push({
                key: d.innerText,
                value: d.dataset.value,
            })
        }
        return r
    },

    // 清除选中
    selected_clear() {
        this.selected_list().removeClass('active')
        this.selected_update()
    },

    // 解析播放列表
    parse_url(url) {
        this.url = url
        this.data = {}
        this.tabs.clear()
        closeWindows()

        $('#playlist_detail').html('<div class="w-full text-center loading"><div class="spinner-grow text-center text-blue mt-3" role="status"></div></div>')
        g_rule.playlist_parse(url, data => {
            console.log(data)
            g_playlist.parse(data)
        })
    },

    init() {
        const self = this
        g_action.registerAction({
            prompt_parsePlaylist() {
                prompt(getClipboardText(), {
                    title: '解析链接',
                }).then(url => {
                    self.parse_url(url)
                })
            },
            playlist_loadURL(dom, action) {
                toast('正在加载播放列表中...')
                g_playlist.parse_url(action[1] || getParentAttr(dom, 'data-target'))
            },
            playlist_openURL(dom) {
                ipc_send('url', getParentAttr(dom, 'data-target'))
            },
            playlist_item_click(dom, action, e) {
                if (e.shiftKey) { // 范围选中
                    let list = self.selected_list()
                    if (list.length) {
                        let par = $(dom).parent()
                        let i1 = $(list[0]).index()
                        let i2 = $(dom).index()
                        for (let i = Math.min(i1, i2); i <= Math.max(i1, i2); i++) {
                            par.find(`.btn:eq(${i})`).addClass('active')
                        }
                    }
                } else {
                    if (!e.ctrlKey) self.selected_clear()
                    $(dom).toggleClass('active')
                }
                self.selected_update()
            },
            playlist_copyLink() {
                ipc_send('copy', self.url)
            },
            playlist_web() {
                ipc_send('url', self.url)
            },
            playlist_folder() {
                let path = self.getSaveTo(self.data.title)
                if (nodejs.files.exists(path + 'playlist.json')) path += 'playlist.json'
                ipc_send('openFolder', path)
            },
            playlist_refresh() {
                self.playlist_loadLast()
            },
            playlist_download() {
                let { title } = self.data
                let pathName = getConfig('savePath') + title + '\\'
                let i = 0
                self.selected_vals().forEach(({ key, value }) => {
                    i++
                    g_downloader.item_add(guid(), {
                        url: value,
                        pathName,
                        type: 'media_fetch',
                        fileName: key + '.mp4',
                        category: title
                    }, false);
                })
                i && g_detailTabs.tabs.tab_ative('downlist')
            },
            playlist_coll_toggle() {
                toast('成功' + (g_coll.coll_toggle(self.url, self.data) ? '收藏' : '取消收藏'))
            },
            playlist_item_selected_clear: dom => self.selected_clear(),
        })

        let getBtn = () => self.playlist_getItem(g_videoTabs.tabs.tab_getValue().url)
        g_plugin.registerEvent('playPrev', () => {
            getBtn().prev().click()
        })
         g_plugin.registerEvent('playNext', () => {
            getBtn().next().click()
        })

        this.tabs = g_tabs.register('playlist_tabs', {
            target: '#playlist',
            saveData: false,
            parseContent: (k, v) => {
                let h = ''
                for (let [title, url] of Object.entries(v.list)) {
                    // TODO 移除括号内容
                    h += `
                        <button class="btn btn-outline-secondary position-relative" data-action="playlist_item_click" data-value="${url}">${title}
                        ${nodejs.files.exists(self.getSaveTo(self.data.title, title+'.mp4')) ? '<span class="badge bg-success badge-notification badge-pill"></span>' : ''}
                        </button>
                    `
                }
                return `
                 <div class="btn-list p-2">
                    ${h}
                 </div>
                `
            },
            onShow: tab => {},
            onShown: tab => {},
            onHide: tab => {},
            onClose: tab => {

            },
        })

        let dropdown = g_dropdown.register('playlist_more', {
            position: 'start,top',
            offsetLeft: 0,
            offsetTop: 0,
            onShow: function() {

            },
            list: [{
                title: '打开目录',
                icon: 'folder',
                action: 'playlist_folder',
            }, {
                title: '刷新',
                icon: 'refresh',
                action: 'playlist_refresh',
            }]
        })

    },

    getSaveTo(pathName = '', fileName = '') {
        return getConfig('savePath') + pathName.replace('(' + cutString(pathName, '(', ')', 0, false) + ')', '').trim() + '\\' + fileName
    },

    playlist_loadLast() {
        let playlist = getConfig('playlist_last')
        if (playlist) {
            g_playlist.parse(playlist)
        }
    },


    // 解析播放列表
    parse(data) {
        this.data = data
        setConfig('playlist_last', data)
        let { title, cover, desc, list } = data
        if (!list) return toast('没有捕获到剧集', 'danger')

        let path = this.getSaveTo(title)
        if (nodejs.files.exists(path)) { // 如果目录存在,表示有视频下载
            nodejs.files.write(path + 'playlist.json', JSON.stringify({ title, cover, desc }))
        }

        $('#playlist_detail').attr('data-playlist', data.url).html(`
             <div class="card">
              <div class="card-body">
                <div class="row align-items-center">
                  <div class="col-4">
                    <img src="./res/loading.gif" data-src="${cover}" class="border rounded-3 lazyload">
                  </div>
                  <div class="col">
                    <h3 class="card-title mb-1">
                      <a href="#" class="text-reset">${title}</a>
                    </h3>
                    <div class="text-muted" style="text-overflow: ellipsis;display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 4;line-height: 20px;max-height: 100px;overflow-y: hidden;" title="${data.desc}">
                      ${desc}
                    </div>
                <div class="btn-list pt-3 justify-content-center scroll-x  flex-nowrap">
                        <a class="btn btn-pill btn-ghost-primary position-relative" data-action="playlist_download" title="下载" >
                          <i class="ti ti-download fs-2"></i>
                          <span class="badge bg-blue badge-notification badge-pill hide1"></span>
                        </a>
                        <a class="btn btn-pill btn-ghost-warning" data-action="playlist_copyLink" title="复制信息">
                          <i class="ti ti-link fs-2"></i>
                        </a>
                         <a class="btn btn-pill btn-ghost-secondary" data-action="playlist_web" title="网页打开">
                          <i class="ti ti-world fs-2"></i>
                        </a>
                        <a class="btn btn-pill btn-ghost-warning" data-action="playlist_coll_toggle" title="收藏">
                          <i class="ti ti-star fs-2"></i>
                        </a>
                        <a class="btn btn-pill btn-ghost-secondary" title="更多选项" data-target-dropdown="playlist_more">
                          <i class="ti ti-dots fs-2"></i>
                        </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        `).find('.lazyload').lazyload()

        let items = {}
        let keys = Object.keys(list)
        for (let [k, v] of Object.entries(list)) {
            items[k] = {
                id: k,
                title: k,
                list: v
            }
        }
        this.tabs.setItems(items)
        if (keys.length) {
            this.tabs.tab_ative(keys[0]) // 默认选中第一个
            g_detailTabs.tabs.tab_ative('playlist')
        } else {
            toast('没有捕获到播放列表', 'danger')
        }
    },
}
g_detailTabs.register('playlist', {
    // index: 3,
    onTabChanged: tab => {
        if (!g_playlist.data) g_playlist.playlist_loadLast()
    },
    onVideoEvent: (type, { tab }) => {
        if (type == 'show') {

        }
    },
    tab: {
        id: 'playlist',
        title: '<i class="ti ti-list fs-2"></i>',
        html: `
            <div id="playlist_detail"></div>
            <div class="overflow-y-auto h-full" style="padding-bottom: 50px;" id="playlist"></div>

            `
    },
}, g_playlist)