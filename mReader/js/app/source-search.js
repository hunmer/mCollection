g_source.search = {
    self: g_source,
    searchResult: [],
    init() {
        const self = this
        g_offcanvas.register('search', {
            once: false,
            title: '搜索',
            width: '600px',
            class: 'offcanvas-end',
            // TODO 更多搜索条件
            html: `
            	 <div class="input-group position-relative">
	                <i class="ti ti-search fs-2 position-absolute" style="left: 10px;top: 8px;z-index: 999;"></i>
	                <input style="padding-left: 35px;" type="text" class="form-control" placeholder="搜索作品..." data-keydown="input_search">
	                <select id="select_search" class="form-control"></select>
	                <button data-bs-toggle="dropdown" type="button" class="btn dropdown-toggle dropdown-toggle-split" aria-expanded="false"></button>
	                <div class="dropdown-menu dropdown-menu-end" style="">
	                   <a class="dropdown-item" href="#" data-action="books_upload">
	                    编辑站点
	                  </a>
	                </div>
	            </div>

							<div id="source_search" class="overflow-y-auto" style="height: calc(100vh - 50px)"></div>
						`,
						onShow(){
							let h = ''
							Object.keys(g_source.list).forEach((name, i) => h += `<option ${i == 0 ? 'checked' : ''}>${name}</option>`)
							$('#select_search').html(h)
						}
        })

        g_action.registerAction({
            modal_search: () => self.show(),
            search_itemDetail(dom) {
                g_library.library_detail(self.searchResult[getParentAttr(dom, 'data-index')])
            },
            input_search(dom, a, e){
            	if(e.keyCode == 13){
            		let keyword = dom.value
            		let site = $('#select_search').val()
            		self.search({
				            site,
				            keyword,
				            page: 1
				        })
            	}
            }
        })
    },

    searchAPI(opts) {
        return this.self.api(Object.assign({
            page: 1,
        }, opts), 'search')
    },

    search(opts) {
        this.searchAPI(opts).then(ret => {
            this.searchResult = ret.map(item => {
                let { site, id } = g_source.parseLink(item.link)
                return Object.assign({
                    tags: [],
                    desc: '',
                    site,
                    id
                }, item)
            })
            this.show()
        })
    },

    show() {
        this.refresh()
        g_offcanvas.show('search')
    },

    refresh() {
        let h = ''
        let getBadge = g_tabler.build_badge
        this.searchResult.forEach((v, i) => {
            // 
            h += `
		  <div class="card mt-2" data-index="${i}">
            <div class="row row-0">
              <div class="col-3 position-relative">
              	${v.finished ? `<div class="ribbon ribbon-top ribbon-end bg-primary w-unset fs-5 p-1"><b>完</b></div>` : ''}
                <img src="${v.cover}" class="w-100 h-100 object-cover card-img-start cursor-pointer">
                ${g_library.library_exists(v) ? `<span class="badge bg-danger position-absolute end-0 bottom-0">已添加</span>` : ''}
              </div>
              <div class="col">
                <div class="card-body">
                  <h3 class="card-title text-nowarp">${v.title}</h3>  
                  <p class="text-muted text-nowarp" title="${v.desc}">${getBadge(v.pages, 'lime')} ${getBadge(v.author, 'pink')} ${getBadge(v.category, 'green')}</p>
                  <div class="w-full">
              		${(() => {
              			let h = ''
              			v.tags.forEach(tag => h += getBadge(tag))
              			return h
              		})()}
                  </div>

                   <div class="text-center mt-2 d-flex align-items-center">
                      <a class="text-muted col">
                          <i class="ti ti-world fs-2" data-url="${v.link}" title="在浏览器打开"></i>
                      </a>
                      <button class="btn btn-primary" data-action="search_itemDetail">详情</button>
                   </div>
                </div>
              </div>
            </div>
          </div>
		`
        })
        $('#source_search').html(h)

    }

}

g_source.search.init()