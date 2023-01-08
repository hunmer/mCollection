var g_library = new basedata({
    name: 'library',
    event: true,
    list: local_readJson('library', {}),
    saveData: data => local_saveJson('library', data),
    insertDefault() {
        return {
            date: new Date().getTime()
        }
    },
    // TODO 书架支持标签过滤，用来记录一些看过的内容
    init() {
        const self = this
        g_plugin.registerEvent('library_set', ({ key, vals, exists }) => {
            if (!exists) { // 新添加
                toast('成功添加到书架: ' + vals.title, 'success')
            }
        })
        g_plugin.registerEvent('library_remove', ({ key, vals }) => {
            toast('成功从书架移除: ' + vals.title, 'secondary')
        })

        g_offcanvas.register('library', {
            once: false,
            title: '书架',
            width: '600px',
            class: 'offcanvas-end',
            html: `
                <div id="library_list" class="row"></div>
            `,
        })

        g_action.registerAction({
            library_list() {
                self.refresh()
                g_offcanvas.show('library')
            },
            library_detail(dom) {
                self.library_detail(self.get(getParentAttr(dom, 'data-key')))
            },
            library_read(dom) {
                let key = getParentAttr(dom, 'data-key')
                self.library_read(key)
                setConfig('lastRead', key)
            }
        })

        $(() => {
            let last = getConfig('lastRead')
            last && self.library_read(last)
        });

    },

    library_read(key) {
        g_offcanvas.hide('library')

        let d = this.get(key)
        if (d) {
            g_library.current = d
            g_chapters.parse(d)
        }
    },

    library_exists(v) {
        return this.get(this.library_getKey(v)) !== undefined
    },

    library_getKey(v) {
        return typeof(v) == 'object' ? v.site + '||' + v.id : v
    },

    library_getData(v) {
        return this.get(this.library_getKey(v))
    },

    library_detail(v) {
        const self = this
        let k = self.library_getKey(v)
        let getBadge = g_tabler.build_badge
        let exists = self.get(k)
        g_modal.modal_build({
            html: `
             <div class="card">
                <div class="text-center p-2">
                    <img src="${v.cover}" class="h-full shadow" >
                </div>
                <div class="ribbon ribbon-top ribbon-end bg-danger w-unset fs-5 p-1"><b>${v.pages} Pages</b></div>
                <div class="card-body">
                  <h3 class="card-title text-nowarp">${v.title}</h3>  
                  <p class="text-muted">${getBadge(v.author, 'pink')} ${getBadge(v.category, 'green')}</p>
                  <p class="text-muted overflow-y-auto" style="max-height: 100px;">${v.desc}</p>

                  <div class="w-full">
                    ${(() => {
                        let h = ''
                        v.tags.forEach(tag => h += getBadge(tag))
                        return h
                    })()}
                  </div>
                   <div class="text-center mt-2 d-flex align-items-center">
                       
                   </div>
                </div>
            </div>`,
            id: 'noval_detail',
            type: 'success',
            title: '作品详情',
            buttons: [{
                text: exists ? '从书架移除' : '添加到书架',
                class: 'btn-primary',
                async onClick() {
                    if (!exists) {
                        // 获取章节信息一并写入
                        toast('正在添加中...')
                        
                        let detail = await g_source.loadLink(v.link, 'detail')
                        if (!detail) return toast('获取章节信息失败', 'danger')
                        Object.assign(v, detail) // 完整信息覆盖
                    }
                    self.toggle(k, v)
                }
            }, {
                text: '已读',
                class: 'btn-primary',
                onClick(e){

                }
            }],
        })
    },

    refresh() {
        let h = ''

        this.entries((k, v) => {
            let chapters = Object.values(v.chapters)
            let progress = parseInt(chapters.filter(chapter => chapter.last).length / chapters.length * 100)
            h += `
                <div class="col-4 card " data-key="${k}" data-contenx="library_detail">
                    <div class="ribbon ribbon-top ribbon-end bg-danger w-unset fs-5 p-1"><b>${progress}%</b></div>
                        <div class="position-relative">
                            <img data-action="library_read" src="${v.cover}" class="w-full cursor-pointer">
                             ${v.last ? `<span class="badge bg-primary position-absolute bottom-0 end-0" title="${v.chapters[v.lastChapter].title}">${getFormatedTime(5, v.last)}</span>` : ''}
                        </div>
                        <p class="text-center text-nowarp text-muted mt-3">${v.title}</p>
           </div>
            `
        })
        $('#library_list').html(h)
    },
})