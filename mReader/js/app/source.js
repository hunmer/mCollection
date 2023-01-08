var g_source = {
    list: {

    },
    current: {
        page: 1,
    },
    init() {
        const self = this
        // this.loadLink('https://www.no-ichigo.jp/read/book/book_id/1531726/20' )
        // this.loadLink('https://www.no-ichigo.jp/book/n1531726/3')
        g_plugin.registerEvent('afterLoadLink', ({ link, method, ret }) => {
            if (method == 'load') { // 加载完章节
                g_chapters.setReaded(g_source.getKey(), link)
            }
        })

        g_action.registerAction({
            modal_parse() {
                g_form.confirm1({
                    title: '解析',
                    elements: {
                        link: {
                            title: '链接',
                            required: true,
                            value: getClipboardText(),
                            // value: 'https://www.no-ichigo.jp/read/book/book_id/1545159',
                        },
                    },
                    callback({ vals }) {
                        self.loadLink(vals.link, 'detail').then(detail => {
                            g_library.library_detail(detail)
                        })
                    }
                })
            }
        })

    },

    loadLink(link, method = 'load') {
        return new Promise(reslove => {
            let ret = this.parseLink(link)
            if (ret) {
                g_plugin.callEvent('beforeLoadLink', { link, method, ret }).then(async () => {
                    let val
                    switch (method) {
                        case 'load':
                            // 解析URL是否包含其他参数
                            let meta = urlMatchs(link, 'https://www.no-ichigo.jp/book/{id}/{page}') || {}
                            this.setCurrent(Object.assign({
                                page: parseInt(meta.page) || 1,
                            }, ret))
                            this.nextPage()
                            break;

                        case 'detail':
                            val = await this.api(ret, 'getDetail')
                            val.link = link
                            break
                    }
                    g_plugin.callEvent('afterLoadLink', { link, method, ret })
                    reslove(val)
                })
            }
        })

    },

    prevPage() {
        let page = parseInt(g_content.getItem('').get(0).dataset.chapter.split('||')[2]) // 获取当前展示的第一页
        if (page <= 1) return
        g_content.clear()

        this.current.page = page - 1
        this.loadPage(this.current, 'prepend').then(() => {
            g_content.scrollTo('bottom')
        })
    },

    nextPage() {
        this.loadPage(this.current)
    },

    loadPage(opts, method = 'append') {
        return new Promise(reslove => {
            let { site, id, page } = opts
            this.setCurrent(opts)

            if (typeof(nodejs) != 'undefined') {

                let { exists, read } = nodejs.files
                let file = getCacheFile(`chapters\\${site}\\${id}`, 'json', page)
                if (exists(file)) { // 存在单页数据则只加载单页
                    opts.page += 1
                    let data = JSON.parse(read(file))
                    g_content.setContent(data, method)
                    return reslove(data)
                }
            }

            this.api(opts, 'nextPage').then(val => {
                if (val.status == 0) {
                    val.data.pages.forEach(item => {
                        g_content.setContent(item, method)
                    })
                    reslove(val)
                }
            })
        })
    },

    api(opts, method) {
        return new Promise(reslove => {
            console.log(opts, method)
            let { site, id, page, noCache } = opts

            this.get(site)[method](opts, data => {
                data = Object.assign(data || {}, { site, id })
                console.log(data)
                if (method == 'nextPage' && isEmpty(data.errMsg)) {
                    data.data.pages.forEach(item => {
                        item = Object.assign(item, { site, id }) // 标识
                        if (typeof(nodejs) != 'undefined') {
                            // 写入缓存
                            let file = getCacheFile(`chapters\\${site}\\${id}`, 'json', item.page)
                            if (!nodejs.files.exists(file)) {
                                nodejs.files.write(file, JSON.stringify(item))
                            }
                        }
                    })
                }
                reslove(data)
            })
        })
    },

    modal_parseLink() {

    },

    setCurrent(opts) {
        opts.page = parseInt(opts.page)
        this.current = opts
        return this.current
    },

    getKey(opts) {
        let { site, id } = opts || this.current
        return site + '||' + id
    },

    parseLink(link) {
        for (let [k, v] of Object.entries(this.list)) {
            let ret = v.parseLink(link)
            if (ret) return Object.assign({ site: k }, ret)
        }
    },

    entries(callback) {
        for (let [k, v] of Object.entries(this.list)) {
            if (callback(k, v) === false) return
        }
    },

    get(key) {
        return this.list[key]
    },

}

g_source.init()

function fetch1(url, type, opts = {}) {
    return new Promise(reslove => {
        if (typeof(nodejs) != 'undefined') {
            let file = getCacheFile('url', 'json', nodejs.files.getMd5(url))
            let { exists, write, read } = nodejs.files
            if (exists(file)) reslove(JSON.parse(read(file)))
        } else {
            url = 'https://picmanager-room.glitch.me/proxy?url=' + url
        }
        // opts.proxy = 'http://127.0.0.1:4780'
        fetch(url, opts).then(resp => {
            resp[type]().then(data => {
                typeof(write) != 'undefined' && write(file, JSON.stringify(data))
                reslove(data)
            })
        })
    })

}