
g_setting.setDefault({
    multiTab: true,
    tab_memory: true,
})

var g_datalist = {
    tab_new(opts) {
        !getConfig('multiTab') && this.tabs.clear()
        let {sqlite, title, type, icon} = opts
        if(!sqlite) return

        sqlite = new SQL_builder(sqlite) // 保证对象兼容
        let find = this.tabs.data.values().find(item => item.data.sqlite?.equal(sqlite))

        if(!find){
            this.tabs.add({
                icon,
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

    tab_clear(tab, load){
        this.tab_setItems([], tab, load)
    },

    tab_setItems(items, tab, load) {
        this.tab_getContent(tab).html('')
        let data = this.tab_getData(undefined, tab)
        data.items = items
        data.page = -1
        load && this.page_nextPage()
    },

    tab_getContent(tab) {
        return this.getContent(tab).find('.datalist-items')
    },

    // 指定tab加载items
    async tab_loadItems(items, tab, insert = 'appendTo') {
        let {sqlite, view} = this.tab_getData(undefined, tab)
        if(!sqlite) return
        let table = sqlite.getOption('table')
        let target = this.tab_getContent(tab)
        Promise.all(items.map(item => this.item_parse({data: item, view, table}))).then(arr => {
            let h = arr.join('')
            target.find('.nomore').remove()
            if (!h) h = this.view_getVal('noMore')
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
        view ??= this.view_getCurrentView()
        return this.views[view].item(d)
    },

    view_register(view, opts) {
        this.views[view] = Object.assign({

        }, opts)
        opts.init && opts.init()
    },
    // 切换视图
    tab_setVal(k, v, tab) {
        tab ??= this.getCurrentTab()
        this.tabs.data.setVal(tab, 'data.'+k, v)
        this.tab_refresh(tab)
    },

    tab_refresh(tab){
        tab ??= this.getCurrentTab()
        this.tab_clear(tab, false)
        this.tabs.generalTab(tab)
    },

    view_getCurrentView(tab){
        tab ??= this.getCurrentTab()
        return g_datalist.tab_getData('view', tab)
    },

    // 返回视图基本结构
    view_getVal(key, view) {
        view ??= this.view_getCurrentView()
        return toVal(this.views[view][key])
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
                    <div class="row w-full m-0">
                        <div id="filters" class="d-flex col" ></div>
                        <div id="datalist_actions" class="d-flex col flex-row-reverse align-items-center"></div>
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

        g_style.addStyle('datalist', `

            .datalist {
                padding-bottom: 150px;
            }
      
            .datalist-item {
                
            }

            .nomore {
                margin-bottom: 100px;
            }
        
        `)


        g_plugin.registerEvent('db_connected', data => {
            if (data.first && data.opts.type === DB_TYPE_DEFAULT) { 
                let opts = {
                    nowarp: true,
                    name: 'tablist',
                    container: '#itemlist_tabs',
                    event_shown({tab, inst}){
                        let item = inst.getData(tab)
                        if (item.data.sqlite != undefined && !self.tab_getContent(tab).find('.datalist-item').length) { // 没有数据
                            self.page_toPage(tab, 0)
                        }
                    },
                    parseContent(k, v){
                        return self.view_getVal('container', v.data.view)
                    },
                    defaultTab: {
                        icon: 'house',
                        title: '主页',
                        data: {},
                        html: `
                            <h1 class="text-center">一个标签页都没有...</h1>
                        `
                    },
                    defaultMenuItems: {
                        close: {
                            icon: 'x',
                            text: '关闭',
                        },
                        closeOther: {
                            icon: 'x',
                            text: '关闭其他',
                        },
                    },
                    menuItems: {
                        refresh: {
                            icon: 'refresh',
                            text: '刷新',
                            callback({key, name}){
                               g_datalist.tab_clear(key)
                            }
                        },
                        detail: {
                            icon: 'list',
                            text: '详细',
                            callback({key, name}){
                                prompt(JSON.stringify(this.data.get(key), null, 4), {rows: 20, scrollable: true})
                            }
                        }
                    }
                }
                if(getConfig('tab_memory')){
                    let id = 'tab_tablist_'+g_db.current
                    opts.list = () => {
                        let data = local_readJson(id, []).filter(item => item.data.sqlite != undefined)
                        data.forEach(item => {
                            item.data.sqlite = new SQL_builder(item.data.sqlite)
                            item.data.page = 0 // 重置页数
                            item.data.items = []
                            item.hasMore = true
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

        g_hotkey.register('ctrl+shift+keyw',  {
            title: '关闭全部tab',
            content: "g_datalist.tabs.clear()",
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
                    value: () => getConfig('multiTab'),
                },
                tab_memory: {
                    title: '标签记忆',
                    help: '仅多标签模式下',
                    type: 'switch',
                    value: () => getConfig('tab_memory'),
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
        return this.page_toPage(tab, parseInt(this.tab_getData('page', tab)) + 1)
    },

    // 到指定页数
    async page_toPage(tab, page = 0) {
        let data = Object.assign(this.tab_getData(undefined, tab), {page})
        var {page, pagePre, sqlite, sort, reverse} = data
        let start = page * pagePre
        let query = sqlite.toString()
        let table = sqlite.getOption('table')
        
        if (data.items.length == 0) { // 初次加载
            let b = ['id', 'size', 'title', 'birthtime'].includes(sort)
            if(b) sqlite.setOption('order', sort+' '+(reverse ? 'DESC' : 'ASC'))
            data.items = await this.sort.do_sort(sort, await data.sqlite.all())
            if(!b && reverse) data.items = data.items.reverse() 
            await g_plugin.callEvent('datalist.tab.initItems', {tab, items: data.items})
        }

        let items = await Promise.all(data.items.slice(start, data.pagePre + start).map(async ({ md5 }) => {
            let item = await g_data.data_getData(md5, table)
            return item
        }))
        let hasMore = data.hasMore = items.length >= pagePre
        this.tab_loadItems(items, tab)
        setTimeout(() => {
            if (hasMore && !isScroll(this.tab_getContent(tab)[0]).scrollY) { // 还可以加载
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