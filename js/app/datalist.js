var g_datalist = {
    views: {}, // 可切换的视图
    tab_new(opts) {
        if(!opts) return
        getConfig('oneTab') && this.tabs.clear()
        let {sqlite, value, title, type} = opts
        
        this.tabs.try_add(v => {
            return v[1].data.sqlite.equal(sqlite)
        }, { // 不重复打开
            title: toVal(title, ),
            data: {
                type,
                sqlite,
                value, // 目标参数，{type: folder, value: 文件夹} 
                view: 'default', // 展示样式
                page: 0, // 当前页数
                pagePre: 20,
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

    // 关闭tab
    tab_remove(tab) {
        return this.tab_method('tab_remove', tab)
    },

    // 带tab名称的动态tab方法
    tab_method(method, tab, ...args) {
        if (!tab) tab = this.tab_getCurrent()
        return this.tabs[method](tab, ...args)
    },

    // 返回tab属性
    tab_getOpts(tab) {
        return this.tabs.tab_getValue(tab)
    },

    tab_getData(k, tab){
        return this.tab_getOpts(tab).data[k]
    },

    tab_getTable(tab){
        return g_datalist.tab_getData('sqlite', tab).getOption('table')
    },

    // 清空tabn内容
    tab_clearItems(tab) {
        this.tab_getContent(tab).html('')
    },

    tab_refresh(tab) {
        this.tab_setItems([], tab)
    },

    // 设置items
    tab_setItems(items, tab) {
        let data = this.tab_method('tab_getValue', tab).data
        data.items = items
        data.loaded = []
        data.page = -1
        this.tab_clearItems(tab)
        this.page_nextPage()
    },

    tab_getContent(tab) {
        return this.content_get(tab).find('.datalist-items')
    },

    // 指定tab加载items
    async tab_loadItems(items, tab, insert) {
        let self = this
        if (!insert) insert = 'appendTo'

        let tab_data = this.tab_method('tab_getValue', tab)
        if (!tab_data) return

        let opts = tab_data.data
        let table = opts.sqlite.getOption('table')
        let target = this.tab_getContent(tab)
        Promise.all(items.map(item => this.item_parse({data: item, view: opts.view, table}))).then(arr => {
            let h = arr.join('')
            target.find('.nomore').remove()
            if (!h) {
                h = `
                <div class="text-center p-2 nomore">
                    <i class="ti ti-mood-empty fs-2"></i>
                    <p>没有更多了...</p>
                </div>`
            }
            this.tab_updateElements($(h)[insert](target))
        })
    },

    // 更新dom
    tab_updateElements(dom){
         dom.find('.lazyload').lazyload()
         g_setting.apply('itemWidth') // 更新宽度
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
            // saveData: (name, data) =>  g_db.db_saveJSON('tabs_' + name, data),
            // getData: name =>  g_db.db_readJSON('tabs_' + name, {}),
        })

        g_ui.register('datalist', {
            target: '#content',
            html: `
                <div class="position-relative w-full" style="height: calc(100vh - 35px);overflow: hidden;">
                    <div class="row w-full">
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
                let div = self.content_get(tab)
                if (!div.find('.datalist-item').length) { // 没有数据
                    self.page_toPage(tab, 0)
                }
            },
            onHide: tab => {},
            onClose: tab => {}
        }).show()

    },

    // 解析item结构
    async item_parse(opts) {
        let {data, view, html} = opts 
        let {file, cover, md5} = Object.assign(data, g_item.item_getVal(['cover', 'file'], data))
        
        return (html || await this.get_html(data, view)).
        replace('{dargable}', !file.startsWith('http') ? ' data-file="' + file + '" draggable="true"' : '').
        replace('{preview}', (true || ['mp4', 'mp3', 'wav', 'ogg', 'm4a'].includes(getExtName(file))) ? 'data-hover="item_preview" data-hoverTime="300"' : '').
        replace('{md5}', `data-md5="${md5}"`).
        replace('{cover}', cover).
        replace('{file}', file)
    },

    // 下一页
    page_nextPage(tab) {
        return this.page_toPage(tab, 1)
    },

    // 到指定页数
    async page_toPage(tab, add = 0) {
        let data = this.tab_method('tab_getValue', tab).data
        data.page += add

        let start = data.page * data.pagePre;
        let query = data.sqlite.toString()
        let table = data.sqlite.getOption('table')

        if (data.items.length == 0) { // 初次加载
            data.items = await data.sqlite.all()
            // TODO 根据附带参数进行自定义排序
        }

        let items = await Promise.all(data.items.slice(start, data.pagePre + start).map(async ({ md5 }) => {
            let item = await g_data.data_getData(md5, table)
            // 如果是回收站的，则应用meta到对象，让数据直接显示

            return item
        }))
        data.hasMore = items.length >= data.pagePre

        this.tab_loadItems(items, tab)
        setTimeout(() => {
            if (data.hasMore && !isScroll(this.tab_getContent(tab)[0]).scrollY) { // 还可以加载
                this.page_nextPage();
            }
        }, 500);
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