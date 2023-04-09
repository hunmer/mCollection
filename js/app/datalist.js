var g_datalist = {
    tab_new(opts) {
        !getConfig('multiTab') && this.tabs.clear()
        let {sqlite, title, type} = opts
        sqlite = new SQL_builder(sqlite) // 保证对象兼容
        let find = this.tabs.data.values().find(item => item.data.sqlite.equal(sqlite))

        if(!find){
            this.tabs.add({
                title: toVal(title),
                data: {
                    type,
                    sqlite,
                    view: 'default', // 展示样式
                    page: 0, // 当前页数
                    pagePre: 20,
                    items: [], // 所有的md5列表
                },
            }, true)
        }else{
            this.tabs.setActive(find.id)
        }
    },

    getCurrentTab() {
        return this.tabs.getActive()
    },

    getContent(tab){
        tab ??= this.getCurrentTab()
        return this.tabs.getEle(tab)
    },

    tab_remove(tab) {
        tab ??= this.getCurrentTab()
        return this.tabs.remove(tab)
    },

    tab_getData(k, tab){
        tab ??= this.getCurrentTab()
        let d = this.tabs.data.get(tab).data
        return k != undefined ? d[k] : d
    },

    tab_setItems(items, tab) {
        let data = this.tab_getData(undefined, tab)
        data.items = items
        data.page = -1
        this.page_nextPage()
    },

    tab_getContent(tab) {
        return this.getContent(tab).find('.datalist-items')
    },

    // 指定tab加载items
    async tab_loadItems(items, tab, insert = 'appendTo') {
        let self = this
        let {sqlite, view} = this.tab_getData(undefined, tab)
        let table = sqlite.getOption('table')
        let target = this.tab_getContent(tab)
        Promise.all(items.map(item => this.item_parse({data: item, view, table}))).then(arr => {
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
}


// view 
assignInstance(g_datalist, {
    views: {}, // 可切换的视图
    get_html(d, view) {
        return this.views[view || 'default'].item(d)
    },

    view_register(view, opts) {
        this.views[view] = Object.assign({

        }, opts)
        opts.init && opts.init()
    },
    // 切换视图
    view_switch(view, tab) {
        this.tabs.data.setVal(tab, 'data.view', view)
    },

    // 更新视图
    view_update(view, tab) {
        this.view_switch(this.view_getCurrent())
    },

    // 返回视图
    view_getCurrent(tab) {
        return this.tabs.get('view')
    },

    // 返回视图基本结构
    view_getContent(view) {
        return toVal(this.views[view || 'default'].container)
    },

    // 切换排序
    sort_switch(name, tab) {
        this.tabs.data.setVal(tab, 'data.sort', name)
    },

    async view_parseItems(view, items) {
        let opts = this.views[view]
        if (opts) {
            let html = (await Promise.all(items.map(data => this.item_parse({data, view})))).join('')
            return $(toVal(opts.container)).find('.datalist-items').html(html)
        }
    },

})

assignInstance(g_datalist, {
    onScroll(dom) {
        let scrollTop = dom.scrollTop;
        if (scrollTop == 0) {
            // TODO 记录复原往上翻页？
            return;
        }
        if (scrollTop + dom.offsetHeight + 50 >= dom.scrollHeight && !g_pp.timerAlive('nextPage')) {
            g_pp.setTimeout('nextPage', () => g_datalist.page_nextPage(), 200)
        }
    },

    init() {
        const self = this
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
        }).show('datalist')


        g_plugin.registerEvent('db_connected', data => {
            if (data.first && data.opts.type === DB_TYPE_DEFAULT) { 
                let opts = {
                    nowarp: true,
                    name: 'tablist',
                    container: '#itemlist_tabs',
                    event_shown({tab}){
                        if (!self.tab_getContent(tab).find('.datalist-item').length) { // 没有数据
                            self.page_toPage(tab, 0)
                        }
                    },
                    parseContent(k, v){
                        return self.view_getContent(v.data.view)
                    }
                }
                if(getConfig('tab_memory')){
                    let id = 'tab_tablist_'+g_db.current
                    opts.list = () => {
                        let data = local_readJson(id, [])
                        data.forEach(item => {
                            item.data.sqlite = new SQL_builder(item.data.sqlite)
                            item.data.page = 0 // 重置页数
                            item.data.items = []
                        })
                        return data
                    }
                    opts.saveData = data => local_saveJson(id, data)
                }
                self.tabs = new TabList(opts)
                self.tabs.refresh()
            }
        })

        g_hotkey.register('ctrl+keyw',  {
            title: '关闭当前tab',
            content: "g_datalist.tabs.close(g_datalist.getCurrentTab())",
            type: 2,
        })
        
        g_setting.onSetConfig({
            multiTab: () => g_datalist.tabs.clear(),
            tab_memory: b => b && toast('刷新生效!')
        })
        
        g_setting.tabs.tabs = {
            title: '标签页',
            icon: 'box-multiple',
            elements: {
                multiTab: {
                    title: '多标签',
                    type: 'switch',
                    value: () => getConfig('multiTab', false),
                },
                tab_memory: {
                    title: '标签记忆',
                    help: '仅多标签模式下',
                    type: 'switch',
                    value: () => getConfig('tab_memory', false),
                },
            }
        }
     
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
        let data = this.tab_getData(undefined, tab)
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


})