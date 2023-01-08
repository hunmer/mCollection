var g_chapters = {
    init() {
        const self = this

        g_menu.registerMenu({
            name: 'chapter_item',
            selector: '[data-chapter]',
            dataKey: 'data-chapter',
            items: [{
                icon: 'link',
                text: '网页',
                action: 'chapter_item_link'
            }, {
                icon: 'eye',
                text: '',
                action: 'chapter_item_readed'
            }],
            onShow: () => {
                getEle('chapter_item_readed').find('span').html(self.chapters_get(g_menu.key).last ? '未观看' : '已观看')
            }
        });

        g_action.registerAction({
            // 加载章节
            chapters_load(dom) {
                self.chapters_load(getParentAttr(dom, 'data-chapter'))
            },
            // 从头开始阅读
            chapters_start() {
                g_content.clear()
                g_source.current.page = 0
                g_source.nextPage()
            },
            // 缓存章节
            chapters_download(dom) {
                dom = $(dom)
                dom.addClass('btn-loading')
                let { site, id } = self.current
                let opts = { site, id, page: 1 }
                const nextPage = () => {
                    g_source.api(opts, 'nextPage').then(data => {
                        if (isEmpty(data.errMsg)) {
                            setTimeout(() => nextPage(), 500)
                        } else {
                            dom.removeClass('btn-loading')
                        }
                    })
                }
                nextPage()
            }
        }).registerAction(['chapter_item_readed', 'chapter_item_link'], (dom, a, e) => {
            let link = g_menu.key
            switch (a[0]) {
                case 'chapter_item_link':
                    ipc_send('url', link)
                    break;
                    // 切换观看状态
                case 'chapter_item_readed':
                    let item = self.chapters_get(link)
                    item.last = item.last ? undefined : new Date().getTime()
                    g_library.save(false)
                    self.updateItem(link, item)
                    break;
            }
            g_menu.hideMenu('chapter_item')
        })

        g_plugin.registerEvent('onChapterChanged', ({ chapter }) => {
            setConfig('lastChapter', chapter)
            let [site, id, page] = chapter.split('||')
            let d = g_library.get(site+'||'+id)
            d.lastPage = page
            d.last = new Date().getTime()
            g_library.save(false)
        })

    },

    chapters_get(link, current) {
        return g_library.library_getData(current || this.current).chapters[link]
    },

    parseItem(link, item) {
        let { title, last } = item
        return `
            <div class="list-group-item" data-action="chapters_load" data-chapter="${link}">
              <div class="row align-items-center">
                <div class="col-auto"><span class="badge bg-${last ? 'success' : 'secondary'}"></span></div>
                <div class="col text-truncate">
                  <a href="#" class="text-reset d-block">${title}</a>
                  <div class="d-block text-muted text-truncate mt-n1">${last ? new Date(last).format('yyyy-MM-dd hh:mm:ss') : ''}</div>
                </div>
                <div class="col-auto">
                  <a href="#" class="list-group-item-actions">
                    <i class="ti ti-star fs-2"></i>
                  </a>
                </div>
              </div>
            </div>
    `
    },

    chapters_load(link) {
        // TODO 加载进度
        g_content.setContent(`

        `, 'html')
        g_source.loadLink(link)
    },

    updateItem(link, item) {
        this.getItem(link).replaceWith(this.parseItem(link, item))
    },

    // 解析章节列表
    parse(d) {
        let h = ``
        let { site, id } = d
        this.current = { site, id }
        for (let [link, item] of Object.entries(d.chapters)) h += this.parseItem(link, item)
        $('#chapters_list').html(`
          <div class="card">
              <div class="card-header d-flex sticky-top bg-auto">
                <div class="ms-auto">
                    <button class="btn btn-pill" data-action="chapters_start" title="开始阅读" >
                        <i class="ti ti-book fs-2"></i>
                    </button>
                    <button class="btn btn-pill" data-action="chapters_download" title="缓存" >
                        <i class="ti ti-download fs-2"></i>
                    </button>
                    <button class="btn btn-pill dropdown-toggle"  data-bs-toggle="dropdown" data-bs-auto-close="outside" role="button" aria-expanded="false" title="缓存" >
                        <i class="ti ti-dots fs-2"></i>
                    </button>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="#" data-action="">
                            xxxx
                        </a>
                        <div class="dropdown-divider"></div>
                    </div>
                </div>
              </div>
            <div class="list-group list-group-flush list-group-hoverable overflow-y-auto" style="height: calc(100vh - 130px)">${h}</div>
        `)
        if(d.lastPage){
            g_source.loadPage({site, id, page: d.lastPage}, 'html') // 加载最后页面
        }else
        if (d.lastChapter) { // 最后一次加载的章节
            this.chapters_load(d.lastChapter)
        }
    },

    // 返回章节dom
    getItem(chapter) {
        return getEle({ chapter }, '#chapters_list ')
    },
    // 设置是否已读
    setReaded(key, link, readed = true) {
        let d = g_library.list[key]
        if (d) {
            let item = d.chapters[link]
            if (item) {
                let now = new Date().getTime()
                d.lastChapter = readed ? link : undefined // 最后打开的章节
                d.last = readed ? now : undefined // 最后打开的时间

                item.last = readed ? now : undefined // 章节已读标记
                g_library.save(false)
                this.updateItem(link, item)
            }
        }
    },

    refresh() {

    },
}

g_leftTabs.register('chapters', {
    onTabChanged: old => {
        g_chapters.refresh()
    },
    tab: {
        id: 'chapters',
        title: '<i class="ti ti-list fs-2"></i>',
        html: `
            <div class="p-2" id="chapters_list">
               
            </div>
            `
    },
}, g_chapters)