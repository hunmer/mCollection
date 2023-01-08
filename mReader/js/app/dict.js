var g_dict = {


    list: {},
    tabs_register(name, opts) {
        this.list[name] = opts
    },

    tabs_refresh() {
        let items = {}
        for (let [k, v] of Object.entries(this.list)) {
            items[k] = Object.assign({ id: k, html: '' }, v.tab)
        }
        this.tabs.setItems(items)
        setTimeout(() => this.tabs.tab_ative('weblio'), 250)
    },

    init() {
        // this.search('辞書')
        const self = this
        self.modal = g_modal.modal_build({
            id: 'dict_search',
            html: `<div id='search_div'></div>`,
            bodyClass: 'p-0',
            title: '查找单词',
            scrollable: true,
            show: false,
            width: '80%',
            onHide(){
            	self.tabs.clear()
            }
        })

        self.tabs = g_tabs.register('search', {
            target: '#search_div',
            saveData: false,
            hideOneTab: false,
            menu: ` `,
            async onShow(tab, ev) {
                let keyword = self.currentSearch
                if (!isEmpty(keyword)) {
                    let h = await self.list[tab].onSearch(keyword)
                    if (h.startsWith('http')) {
                        h = `
                    		<div class="overflow-y-auto" style="height: calc(100vh - 200px)">
		                        <webview src="${h}" useragent="Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36 Edg/103.0.1264.71" class="w-full h-full"></webview>
		                    </div>
                    	`
                        // preload='file://${__dirname}/js/webview.js' contextIsolation="false" nodeintegration
                    }
                    self.tabs.getContent(tab).html(`<div class="p-2">${h}</div>`)
                }
            }
        })

        self.tabs_register('akanjidict', {
            tab: {
                title: 'KanjiDict',
            },
            onSearch(keyword) {
                return new Promise(reslove => {
                    fetch('http://www.akanjidict.org/query.php?d=' + keyword).then(resp => {
                        resp.text().then(body => {
                            body = clearlyHTML(body)
                            body.find('span[style="color:#AAAAAA;font-family:Courier New;"]').remove()
                            let spans = body.find('table[style="width:100%;border-right:1px solid #DDDDDD;"] td > span')
                            spans.find('div:contains(本站的缓存)').remove()
                            let h = ''
                            spans.each((i, el) => {
                                let h1 = el.innerHTML
                                if (i !== spans.length - 1 && h1.indexOf('没有找到') == -1) {
                                    h += h1
                                }
                            })
                            reslove(h)
                        })
                    })
                })
            }
        })

        self.tabs_register('weblio', {
            tab: {
                title: 'weblio',
            },
            onSearch(keyword) {
                return new Promise(reslove => {
                    fetch('https://www.weblio.jp/content/' + keyword).then(resp => {
                        resp.text().then(body => {
                            body = clearlyHTML(body)
                            let h = ''
                            body.find('.kiji').each((i, el) => h += el.innerHTML)
                            reslove(h)
                        })
                    })
                })
            },
        })

        self.tabs_register('sakura', {
            tab: {
                title: 'sakura',
            },
            onSearch(keyword) {
                return `https://sakura-paris.org/dict/%E5%BA%83%E8%BE%9E%E8%8B%91/prefix/` + keyword
            },
        })

        self.tabs_register('jisho', {
            tab: {
                title: 'jisho',
            },
            onSearch(keyword) {
                return `https://jisho.org/search/` + keyword
            },
        })

          self.tabs_register('google', {
            tab: {
                title: 'google',
            },
            onSearch(keyword) {
                return `https://www.google.com/search?q=` + keyword
            },
        })

        self.tabs_register('yourei', {
            tab: {
                title: '例句',
            },
            onSearch(keyword) {
                // TODO 翻页
                return new Promise(reslove => {
                    fetch(`http://yourei.jp/api/?action=getsentenceswithpropsourcetitle&n=50&start=0&match_type=lemma&ngram=` + keyword).then(resp => {
                        resp.json().then(json => {
                            let h = ''
                            json.sentences.forEach(({ sentence, source, title, properties }) => {
                                h += `
                        			<div class="card mb-2">
					                  <div class="card-body">
					                    <h3 class="card-title">
					                    	${title}
					                    	<span class="card-subtitle">${source}</span>
					                    </h3>
					                    <div>${replaceAll_once(sentence, keyword, `<b class="text-danger">${keyword}</b>`)}</div>
					                  </div>
					                </div>
                        		`
                            })
                            reslove(h)
                        })
                    })
                })
            },
        })

        self.tabs_refresh()
        // self.search('明日')
    },
    currentSearch: '',

    // TODO 多tab
    search(keyword) {
        this.currentSearch = keyword
        this.tabs_refresh()
        this.modal.show()
    }

}

g_dict.init()

function clearlyHTML(body) {
    body = $(body)
    body.find('script,img,link').remove()
    return body
}