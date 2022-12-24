var g_datalist = {
    views: {
        default: {
            container: () => `
                <div class="datalist" onmousewheel="g_action.do(this, 'setItemWidth', event)">
                    <div onScroll="g_datalist.onScroll(this)" class="row row-cards overflow-y-auto datalist-items justify-content-center p-2" style="align-content: flex-start;height: calc(100vh - 100px);"></div>
                </div>
            `,
            item: d => {
                let r = Object.values(getConfig(replaceArr(['%name', '%desc', '%duration', '%ext'], 'show,')))
                return `
                 <div class="datalist-item col-xs-12 col-sm-6 col-md-4 col-lg-4 col-xl-3  p-0 m-0 top-0 col-xxl-2" data-mousedown="item_click" data-dbclick="item_dbclick" {md5} {dargable}>
                    <div class="card card-sm h-full position-relative justify-content-center">
                      ${OR(r[3], `<span class="badge top-5 start-5 position-absolute w-fit">${getExtName(d.file)}</span>`)}
                      <a class="d-block ">
                        <img src="./res/loading.gif" data-src="${d.cover}" class="thumb card-img-top lazyload" {preview}>
                      </a>
                      ${r[0] || r[1] || r[2] ? `
                         <div class="card-body text-nowarp">
                          <div class="d-flex align-items-center ">
                            <div>
                                ${OR(r[0], `<div>${d.title}</div>`)}
                                ${OR(r[1], `<div class="text-muted">${d.desc}</div>`)}
                            </div>
                             <div class="ms-auto">
                                ${OR(r[2], `<span class="text-muted">${getTime(d.json.duration)}</span>`)}
                              </div>
                            </div>
                          </div>
                          ` : ''}
                    </div>
                </div>
            `
            }
        },

        table: {
            container: () => {
                let r = Object.values(getConfig(replaceArr(['%name', '%desc', '%ext', '%duration'], 'show,')))
                return `
                 <div class="datalist table-responsive overflow-y-auto" style="height: calc(100vh - 100px);">
                    <table class="table table-vcenter card-table">
                      <thead>
                        <tr>
                          <th width="150px"></th>
                         ${OR(r[0], `<th>标题</th>`)}
                         ${OR(r[1], `<th>注释</th>`)}
                         ${OR(r[2], `<th>扩展</th>`)}
                         ${OR(r[3], `<th class="w-1">时长</th>`)}
                        </tr>
                      </thead>
                      <tbody onScroll="g_datalist.onScroll(this)" class="datalist-items p-2">
                      </tbody>
                    </table>
                  </div>
                `
            },
            item: d => {
                let r = Object.values(getConfig(replaceArr(['%name', '%desc', '%duration', '%ext'], 'show,')))
                return `
                    <tr data-mousedown="item_click" data-dbclick="item_dbclick" {md5} {dargable}>
                      <th><img src="${d.cover}" class="thumb" {preview}></th>
                      ${OR(r[0], `<td class="text-muted">${d.title}</td>`)}
                      ${OR(r[1], `<td class="text-muted">${d.desc}</td>`)}
                      ${OR(r[2], `<td class="text-muted">${getTime(d.json.duration)}</td>`)}
                      ${OR(r[3], `<td class="text-muted">${getExtName(d.file)}</td>`)}
                    </tr>
                `
            }
        },

          list: {
            container: () => {
                return `
                 <div class="datalist list-group list-group-flush overflow-y-auto" style="height: calc(100vh - 100px);">
                  </div>
                `
            },
            item: d => {
                return `
                     <div class="list-group-item" data-mousedown="item_click" data-dbclick="item_dbclick" {md5} {dargable}>
                      <div class="row">
                        <div class="col-auto">
                          <a href="#" tabindex="-1">
                            <img class="avatar thumb" src="${d.cover}" {preview}>
                          </a>
                        </div>
                        <div class="col text-truncate">
                          <a href="#" data-action="files_load" class="text-body d-block">${d.title}</a>
                          <div class="text-muted text-truncate mt-n1">${d.desc} ${d.json.duration ? getTime(d.json.duration) : ''}</div>
                        </div>
                      </div>
                    </div>
                `
            }
        },


    },

    // 新建视窗
    rule_new(data) {
        let {query, table, sort, rule, title, value} = data = Object.assign({
            query: 'SELECT md5 FROM {table} {rule}',
            table: 'videos',
            sort: 'date',
            rule: ''
        }, data)
        getConfig('oneTab') && this.tabs.clear()

        this.tabs.try_add(function(v) { // 不重复打开
            return v[1].data.query == query && v[1].data.table == table && v[1].data.rule == rule
        }, {
            title,
            data: {
                view: 'default', // 展示样式
                sort, // 排序标记
                value, // 目标参数，{type: folder, value: 文件夹} 
                page: 0, // 当前页数
                cnt: 0, // ?展示数量
                pagePre: 40, // 每页展示
                table, // 目标数据库
                query, // 固定查找参数
                rule, // 条件
                items: [], // 所有的md5列表？
                loaded: [], // 加载过的md5列表
            },
        })
    },

    // 返回现在内容
    content_get(tab) {
        return this.tab_method('getContent', tab)
    },

    // 返回当前tab
    tab_getCurrent() {
        return this.tabs.getCurrentTab()
    },

    tab_remove(tab) {
        return this.tab_method('tab_remove', tab)
    },

    // 带tab名称的动态tab方法
    tab_method(method, tab, ...args) {
        if (!tab) tab = this.tab_getCurrent()
        return this.tabs[method](tab, ...args)
    },
    // 切换视图
    view_switch(view, tab) {
        this.tab_method('tab_setValue', tab, 'data.view', view, true)
    },
    // 更新视图
    view_update(view, tab) {
        this.view_switch(this.view_getCurrent())
    },

    // 返回tab属性
    tab_getOpts(tab) {
        return this.tabs.tab_getValue(tab)
    },

    // 返回视图
    view_getCurrent(tab) {
        return this.tab_getOpts('view')
    },

    // 返回视图基本结构
    view_getContent(view) {
        return this.views[view || 'default'].container()
    },

    // 切换排序
    sort_switch(name, tab) {
        this.tab_method('tab_setValue', tab, 'data.sort', name, true)
    },

    get_html(d, view) {
        return this.views[view || 'default'].item(d)
    },


    onScroll(dom) {
        let scrollTop = dom.scrollTop;
        if (scrollTop == 0) {
            // TODO 记录复原往上翻页？
            return;
        }
        if (scrollTop + dom.offsetHeight + 50 >= dom.scrollHeight) {
            g_pp.setTimeout('nextPage', () => g_datalist.page_nextPage(), 200)
        }
    },

    init() {
        const self = this

        g_tabs.init({
            saveData: (name, data) =>  g_db.db_saveJSON('tabs_' + name, data),
            getData: name =>  g_db.db_readJSON('tabs_' + name, {}),
        })
        g_ui.register('datalist', {
            target: '#content',
            html: `
                <div class="position-relative w-full" style="height: calc(100vh - 35px);overflow: hidden;">
                    <div class="row w-full pb-3 p-2" style="height: 30px">
                        <div id="filters" class="d-flex col" ></div>
                        <div id="datalist_actions" class="d-flex col flex-row-reverse"></div>
                    </div>

                    <div id="itemlist_tabs"  data-out="item_unpreview" data-outfor="item_preview" class="overflow-y-auto border-unset" style="padding-bottom: 100px;"></div>
                    <div class="position-absolute bottom-0 w-full border-top p-2 card" style="height: 50px">
                        <div class="d-flex align-items-center mr-2 hide1" id="bar_import">
                            <div class="flex-grow-1 ">
                                <div class="progress border" style="height: 20px">
                                  <div class=" progress-bar progress-bar-striped" role="progressbar" style="width: 70%"></div>
                                </div>
                            </div>
                            <div class="m-1">
                                <span class="badge bg-warning">
                                    <i class="ti ti-hourglass-high me-1"></i><span>20</span>
                                </span>
                                <span class="badge bg-success">
                                    <i class="ti ti-check me-1"></i><span>20</span>
                                </span>
                                <span class="badge bg-danger">
                                    <i class="ti ti-x me-1"></i><span>20</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            `,
            onShow: function() {},
            onHide: function() {},
        }).show('datalist')

        self.tabs = g_tabs.register('datalist', {
            target: '#itemlist_tabs',
            parseContent: (k, v) => {
                return self.view_getContent(v.data.view)
            },
            // parseTab: (k, v) => v.title,
            onShow: tab => {
                // 如果列表还没初始化进行初始化
                let div = self.content_get(tab)
                // TODO 检测头部有无新数据变动？
                if (!div.find('.datalist-item').length) { // 没有数据
                    // 初始化范围选择
                    // todo 优化选择
                    
                    // if (self.ds) self.ds.stop()
                    // if(typeof(DragSelect) != 'undefined'){
                    //        self.ds = new DragSelect({
                    //         selectables: [],
                    //         area: div.find('.datalist-items')[0],
                    //         draggability: false,
                    //         customStyles: true,
                    //         overflowTolerance: { x: 50, y: 100 }, // xy触发自动滚动的范围
                    //         multiSelectMode: true,
                    //         multiSelectKeys: ['Control'],
                    //         selectedClass: 'item_selected',
                    //         // hoverClass: 'hovered',
                    //     });

                    //     self.ds.subscribe('callback', ({ items }) => {
                    //         g_item.selected_update()
                    //     })

                    //     self.ds.subscribe('dragstart', ({ items }) => {
                    //         if (items.length) {
                    //             if (items[0].dataset.file) { // 跟拖拽文件冲突
                    //                 self.ds.break() // 取消
                    //             }
                    //         }
                    //     })
                    // }
                    self.page_toPage(tab, 0)
                }
            },
            onHide: tab => {

            },
            onClose: tab => {

            }
        }).show()

    },

    // 更新内容
    update(tab) {

    },

    // 解析item结构
     item_parse(d, h = '', view) {
        let { md5 } = d
        d.cover =  g_item.item_getVal('cover', d)
        d.file =  g_item.item_getVal('file', d)
        return (h || this.get_html(d, view)).
        replace('{dargable}', !d.file.startsWith('http') ? ' data-file="' + d.file + '" draggable="true"' : '').
        replace('{preview}', (true || ['mp4', 'mp3', 'wav', 'ogg', 'm4a'].includes(getExtName(d.file))) ? 'data-hover="item_preview" data-hoverTime="300"' : '').
        replace('{md5}', `data-md5="${md5}"`).
        replace('{cover}', d.cover).
        replace('{file}', d.file)
    },

    // 下一页
    page_nextPage(tab) {
        return this.page_toPage(tab, 1)
    },

    tab_clearItems(tab) {
        this.tab_getContent(tab).html('')
    },

    // 到指定页数
    async page_toPage(tab, add = 0) {
        let data = this.tab_method('tab_getValue', tab).data
        // 查询参数
        data.page += add
        let start = data.page * data.pagePre;
        let query = data.query.
        replace('{rule}', data.rule).
        replace('{table}', data.table)

        if(data.items.length == 0){ // 初次加载
            if(query.toLowerCase().indexOf('order by') == -1) { // 没排序
                if(data.sort != 'random'){ // TODO 自带的排序方式
                    query += ` ORDER BY ${data.sort} ${getConfig('sort_reverse') ? 'desc' : 'asc'}`
                }
                // ？ 还是说直接对items进行排序？？？ 
            }
            data.items = await g_data.data_getResults(query)
            // 在这里进行初排序？SQLITE排序的方法好像很有限...
            // 但是如果要更多排序的话，可能要暴力遍历了？？？
            if(data.sort == 'random'){
                data.items = data.items.sort(() => 0.5 - Math.random())
            }
        }
        let items = await Promise.all(data.items.slice(start, data.pagePre + start).map(({md5}) => g_data.data_getData(md5)))
        // let items = await g_data.data_getResults(query)

        // 继续上次的搜索结果？
        // 储存md5列表
        // items.forEach((item, i) => {
        //     if (data.items.includes(item.md5)) {
        //         delete items[i]
        //         console.info('重复md5!!')
        //     } else {
        //         data.items.push(item.md5)
        //     }
        // })
        data.hasMore = (items.length || 0) >= data.pagePre
        this.tab_loadItems(items, tab)
        setTimeout(() => {
            if (data.hasMore && !isScroll(this.tab_getContent(tab)[0]).scrollY) {
                this.page_nextPage();
            }
        }, 500);
    },

    tab_refresh(tab){
        this.tab_setItems([], tab)
    },

    tab_setItems(items, tab){
        let data = this.tab_method('tab_getValue', tab).data
        data.items = items
        data.loaded = []
        data.page = -1
        this.tab_clearItems(tab)
        this.page_nextPage()
    },

    tab_getContent(tab){
        return this.content_get(tab).find('.datalist-items')
    },

    // 指定tab加载items
    tab_loadItems(items, tab, insert) {
        let self = this
        if(!insert) insert = 'appendTo'

        let tab_data = this.tab_method('tab_getValue', tab)
        if (!tab_data) {
            // 当前没有tab
            return
        }
        
        let h = ``;
        let data = tab_data.data
        let target = this.tab_getContent(tab)
        items.forEach(item => {
            let data = g_data.data_parse(item)
            h += this.item_parse(data, '', data.view)
        })

        target.find('.nomore').remove()
        if (!h) {
            h = `
            <div class="text-center p-2 nomore">
                <i class="ti ti-mood-empty fs-2"></i>
                <p>没有更多了...</p>
            </div>`
        }
        let div = $(h)
        div[insert](target).find('.lazyload').lazyload()
        // target.length && self.ds.setSelectables(target[0].querySelectorAll('.datalist-item'))
        g_setting.apply('itemWidth') // 更新宽度

    },

    progress_set(all, succss, error) {
        let i = all - succss - error
        let finish = i <= 0
        let div = $('#bar_import').toggleClass('hide1', finish)
        div.find('.progress-bar').css('width', parseInt(100 * (1 - i / all)) + '%')
        div.find('.bg-warning span').html(i)
        div.find('.bg-success span').html(succss)
        div.find('.bg-danger span').html(error)
    },


}

g_datalist.init()