// tab 保存规则
// 点击左侧入口-> 设置规则函数 -> 如果存在相同规则的tab -> 激活tab 
// 													-> 新建tab带规则参数 -> tab数量=1 隐藏tab列表
class TabList {
    constructor(name, opts) {
        this.name = name
        this.opts = opts

        const onEvent = (method, e) => {
            let target = e.target.parentElement
            let tab = target.dataset.tab
            if(method == 'onShown'){ // 展示
                this.currentTab = tab
                this.tab_setValue(tab, 'last',  new Date().getTime()) // 最后打开时间
                this.save()
            }else{ // 移除
                delete this.currentTab
            }
            opts[method] && opts[method](tab, e)
        }
        // todo onSHOW old tab 参数
        $(`<div class="tablist h-full" data-tablist="${name}" >` + opts.html + '</div>').appendTo(opts.target)
            .on('show.bs.tab', e => onEvent('onShow', e))
            .on('shown.bs.tab', e => onEvent('onShown', e))
            .on('hide.bs.tab', e => onEvent('OnHide', e))
            .on('hiden.bs.tab', e => onEvent('OnHiden', e))

        this.update()
        setTimeout(() => {
            let max = [0, 0]
            let date
            this.entries((k, v) => { // 取最后打开的tab
                date = v.last || 0 
                if(date > max[1]) max = [k, date]
            })
            date != undefined && this.tab_ative(max[0])
        }, 200)

    }

    entries(callback){
        for(let [k, v] of Object.entries(this.opts.items)){
            if(callback(k, v) === false) return
        }
    }

    show(show = true) {
        this.element().toggleClass('show', show)
        return this
    }

    tab_hide() {
        this.show(false)
        return this
    }

    element() {
        return $(`[data-tablist="${this.name}"]`)
    }

    tab_setValue(key, k, v, update = false) {
        setObjVal(this.opts.items[key], k, v)
        this.save()
        update && this.tab_update(key)
    }

    tab_getValue(key) {
        if(key == undefined) key = this.currentTab
        return this.opts.items[key]
    }

    _parseTab(tab, item) {
        if (!item) item = this.opts.items[tab]
        return `<li class="nav-item" data-tab="${tab}" data-dbclick="tab_dbclose">
	          <a href="#_tabs_${tab}" class="nav-link" data-bs-toggle="tab" aria-selected="false" role="tab">${this.opts.parseTab(tab, item)}</a>
	        </li>`
    }

    // 获取指定类型的tabs
    tab_getTypes(type, val){
        let r = []
        for(let [name, item] of Object.entries(this.opts.items)){
            if(item.data.value && item.data.value.type == type){
                if(val != undefined &&  item.data.value.value !== val) continue
                r.push(name)
            }
        }
        return r
    }

    _parseContent(tab, item) {
        if (!item) item = this.opts.items[tab]

        return `
		 <div class="tab-pane h-full" id="_tabs_${tab}" data-content="${tab}">
		 	${ item.html || this.opts.parseContent(tab,item) || ''}
          </div>`;
    }

    // 更新tabs
    update() {
        let h = ''
        let h1 = ''
        let opts = this.opts
        let i = 0
        for (let [tab, item] of Object.entries(opts.items)) {
            h += this._parseTab(tab, item)
            i++
            if (!this.getContent(tab).length) { // content未初始化
                h1 += this._parseContent(tab, item)
            }
        }
        let div = this.element()
        div.find('.d-flex').toggleClass('hide1', i <= 1).
        find('ul').html(this.opts.header(h))
        h1 && div.find('.tab-content').append(h1)
        this.save()
    }

    // 更新单个tab状态
    tab_update(key) {
         // 初始化内容
        this.getTab(key).html(this._parseTab(key))
        this.getContent(key).html(this._parseContent(key))
        this.tab_ative(key) // 触发点击
    }

    // 保存tab状态
    save() {
        this.opts.saveData &&  g_tabs.saveData('tabs_' + this.name, this.opts.items)
    }

    getOpts(){
    	return this.opts
    }

    // 获取内容元素
    getContent(key) {
        if(!key) key = this.currentTab
        return this.element().find('[data-content="' + key + '"]')
    }

    // 获取tab元素
    getTab(key) {
        return this.element().find('[data-tab="' + key + '"]')
    }

    add(val, key) {
        if (!key) key = guid()
        this.opts.items[key] = Object.assign({

        }, val)
        this.update()
        this.tab_ative(key)
    }

    // 尝试添加标签
    try_add(func, vals = {}) {
        let find = Object.entries(this.opts.items).find(func)
        if (find == undefined) { // 规则不存在
            this.add(vals)
        } else {
            this.tab_ative(find[0])
        }
    }

    // 移除标签
    tab_remove(key) {
        this.opts.onRemove && this.opts.onRemove({ tab: key })
        this.getContent(name, key).remove()
        this.getTab(name, key).remove()
        delete this.opts.items[key]
        this.update(name)

        // 默认激活最后一个tab
        let tabs = this.tab_tabs()
        tabs.length && this.tab_ative(tabs.pop())
    }

    // 返回所有tab key
    tab_tabs(){
        return Object.keys(this.opts.items)
    }

    // 清空所有
    clear() {
        Object.keys(this.opts.items).forEach(name => {
            this.tab_remove(name)
        })
    }

    // 激活tab
    tab_ative(key) {
        let a = this.getTab(key).find('a')
        a.length && a[0].click()
    }

    getCurrentTab() {
        // return this.element().find('[data-tab] a.active')
        return this.currentTab
    }
}

var g_tabs = {

    init(funs) {
       Object.assign(this, funs)
        const self = this
        g_dropdown.register('tablist_opts', {
            position: 'top,end',
            offsetLeft: 5,
            dataKey: e => e.parents('[data-tablist]').attr('data-tablist'),
            onShow: function(e) {
                this.opts.list = {
                    edit: {
                        title: '关闭所有',
                        icon: 'x',
                        action: 'tablist_clear',
                    }
                }
            },
        })

        g_action.registerAction({
            // TODO 按钮关闭??
            tab_dbclose: dom => {
                dom = $(dom)
                self.method(dom.parents('[data-tablist]').attr('data-tablist'), 'tab_remove', dom.attr('data-tab'))
            },
            tablist_opts: dom => {
                g_dropdown.show('tablist_opts', dom)
            },
            tablist_clear: dom => {
                let name = g_dropdown.getValue('tablist_opts')
                self.method(name, 'clear')
                g_dropdown.hide('tablist_opts')
            }
        }).
        registerAction(['tab_close'], (dom, action) => {
            let k = g_menu.key
            let name = g_menu.target.parents('[data-tablist]').attr('data-tablist')
            switch (action[0]) {
                case 'tab_close':
                    self.method(name, 'tab_remove', k)
                    break
            }
            g_menu.hideMenu('tab_item')
        })

        g_menu.registerMenu({
            name: 'tab_item',
            selector: '[data-tab]',
            dataKey: 'data-tab',
            html: g_menu.buildItems([{
                icon: 'x',
                text: '关闭',
                action: 'tab_close'
            }])
        });
    },
    list: {},
    instance: {},

    getInstance(name){
    	return this.instance[name]
    },

    register(name, opts) {
        opts = Object.assign({
            saveData: true,
            items: g_tabs.getData(name),
            items: {},
            html: `
			<div class="card bg-unset h-full">
				<div class="d-flex">
		          <ul class="nav nav-tabs col" data-bs-toggle="tabs" role="tablist">
		          </ul>
		          <div class="col-auto">
					 <a class="nav-link" data-action="tablist_opts"><i class="ti ti-dots"></i></a>
		          </div>
		         </div>
	          <div class="card-body h-full">
	            <div class="tab-content h-full">
	            </div>
	          </div>
	        </div>`,
            header: h => `
	        ${h}
	       `,
            parseContent: (k, v) => v.content,
            parseTab: (k, v) => v.title,
        }, opts)
        this.list[name] = opts
        this.instance[name] = new TabList(name, opts)
        return this.instance[name]
    },

    tab_getActive(name){
        return this.getInstance(name).getCurrentTab()
    },

    method(name, method, ...args) {
        let obj = this.instance[name]
        obj[method].apply(obj, args)
    },

    tab_init(name) {

    }

}
