/*
    TODO: 在指定位置弹出dropdown

*/


class _DropDown {
    constructor(name, opts) {
        this.name = name
        opts = Object.assign({
            offsetLeft: 0,
            offsetTop: 0,
            list: {},
            html: '',
            alwaysHide: false,
            autoClose: 'outside'
        }, opts)
        this.opts = opts
        // 注册下直接new _DropDown的接口
        g_dropdown.list[name] = opts
        g_dropdown.instance[name] = this

        return this
    }
    getElement() {
        return $('#_dropdown_' + this.name)
    }
    render(parent = '') {
        let h = this.opts.html || ''
        for (let [n, item] of Object.entries(this.opts.list)) {
            if(item.type == 'divider'){
                h += `<div class="dropdown-divider"></div>`
                continue
            }
            
            let childrens = g_dropdown.getChildrens(this.name, n)
            h += item.html || `<li>
                <a class="dropdown-item ${item.class || ''}" ${childrens.length ? 'data-hover="dropdown_subMenu" data-hoverTime="500" data-out="dropdown_subMenu,remove"' : ''} data-action="${item.action || ''}" data-name="${n}">
                    ${item.icon ? `<i class="me-2 ti ti-${item.icon}"></i>` : ''}
                    ${item.title}

                    ${childrens.length ? `<i class="ti ti-dots position-absolute end-0"></i>` : ''}
                </a>
            </li>`
        }
        return `<ul class="_dropdown dropdown-menu" id="_dropdown_${this.name}" data-dropdown="${this.name}" data-autoClose="${this.opts.autoClose}">
            ${h}
          </ul>`
    }
    show(e, p) {
        e = $(e)
        g_dropdown.target = e
        let f = this.opts.dataKey  
        if(f && e.length) g_dropdown.setValue(this.name, typeof(f) == 'function' ? f(e) : e.attr(opts.dataKey))

        this.opts.onShow && this.opts.onShow.apply(this, e)
        let rect = e[0].getBoundingClientRect()
        let offset = e.offset()
        let left, top;
        let css = {}
        for (let pos of (p || this.opts.position || 'end').split(',')) {
            switch (pos) {
                case 'start':
                    css.left = rect.left
                    css.transform = 'translate(-100%,0%)'
                    break;
                case 'end':
                    css.left = rect.left + rect.width
                    break;
                case 'top':
                    css.top = rect.top
                    break;
                case 'bottom':
                    css.top = rect.top + rect.height 
                    break;
            }
        }
        css.left += this.opts.offsetLeft || 0
        css.top += this.opts.offsetTop || 0
        this.init(css)
        this.opts.onShown && this.opts.onShown.apply(this)
    }


    // 初始化dom,设置位置则显示
    init(css) {
        // console.log(left, top)
        let div = this.getElement()
        let exists = div.length
        if (!exists) div = $(this.render())
        let show = typeof(css) == 'object'
        show && div.css(Object.assign({
            position: 'fixed',
            width: this.opts.width || 'unset',
            height: this.opts.height || 'unset',
            zIndex: 222,
        }, css))
        if (!exists) div.appendTo('body')
        show && div.addClass('show')
    }
    hide() {
        this.opts.onHide && this.opts.onHide.apply(this)
        let div = this.getElement()
        if (this.opts.alwaysHide) {
            div.removeClass('show')
        } else {
            div.remove()
        }
        this.opts.onHiden && this.opts.onHiden.apply(this)
    }
    remove(force = false) {
        this.getElement().remove()
        g_dropdown.remove(this.name)
        this.opts.onRemove && this.opts.onRemove.apply(this)

    }
}


var g_dropdown = {
    init() {
        const self = this
        $(document).
        on('show.bs.dropdown', function(e) {
            let a = e.target
            if (a.dataset.bsDropdownFixed) { // dropdown置顶
                let dropdown = $(a.href || a.nextElementSibling)
                dropdown.length && setTimeout(() => self.pin(dropdown), 1)
            }
        }).
        on('click', '[data-target-dropdown]', function(e) {
            g_dropdown.show(this.dataset.targetDropdown, this, this.dataset.dropdownPos)
            clearEventBubble(e) // 不触发下面的全局点击事件
        }).
        on('click', function(e) {
            // inside outside 判断
            for (let div of $('._dropdown.show')) { // 枚举展示中的dropdown
                let name = div.dataset.dropdown
                let b
                switch ((div.dataset.autoclose || 'true').toString()) { // 判断点击类型
                    case 'true':
                        b = true
                        break;
                    case 'inside':
                        b = inArea(e, div)
                        break;

                    case 'outside':
                        b = !inArea(e, div)
                        break;
                }
                b && g_dropdown.hide(name)
            }
        })

        g_action.registerAction('dropdown_subMenu', (dom, action, e) => {
            // 展示子目录
            dom = $(dom)
            let name = dom.attr('data-name')
            let par = dom.parents('[data-dropdown]')
            let group = par.attr('data-dropdown')

            let method = action[1] ? 'hide' : 'show'
            let menu = self.getChildrens(group, name)[0] // 只显示一个菜单
            let fun = () => menu && self[method](menu, dom)

            self._t1 && clearTimeout(self._t1)
            if (method == 'hide') { // 离开移除
                self._t1 = setTimeout(() => {
                    let target = $(g_cache.mouse.target)
                    let par = target.parents('._dropdown') // Jquery.length 返回undefined 什么鬼
                    if (!par.get(0) || par.attr('data-dropdown') == group && target.attr('data-name') != name) { // 不在dropdown之内 || 不在上次元素之内
                        fun()
                    }
                }, 500)
            } else {
                let menus = self.getChildrens(group) // 获取所有同级菜单
                for (let m of menus) self.hide(m, dom) // 先隐藏所有菜单
                fun()
            }
        })

    },
    list: {},
    instance: {},
    // 返回所有子菜单
    getChildrens(menu, name) {
        let r = []
        let d = this.get(menu)
        return Object.keys(this.list).filter(k => {
            let v = this.list[k]
            return v.parent && v.parent[0] == menu && (!name || v.parent[1] == name)
        })
    },
    get(name) {
        return this.list[name]
    },
    register(name, opts) {
        opts = Object.assign({
            list: {},
        }, opts)
        return new _DropDown(name, opts)
    },

    getElement(name) {
        return $('#_dropdown_' + name)
    },

    getInstance(name) {
        return this.instance[name]
    },

    show(name, e, pos) {
        setTimeout(() => {
            let instance = this.getInstance(name)
            instance && instance.show(e, pos)
        }, 50) // 延迟触发...因为dropdown点击事件检测会在同时触发，一个一个取消点击事件太麻烦了
    },

    hide(name) {
        let instance = this.getInstance(name)
        instance && instance.hide()
    },

    pin(div, pin = true) {
        div = $(div)
        if (pin) {
            let pos = div.position()
            let { left, top } = div.offset()
            div.css({
                position: 'fixed',
                left: left - pos.left,
                top: top - pos.top,
                zIndex: 999
            })
        } else {
            div.css('position', 'absolute')
        }
    },

    keys: {},
    // 设置当前显示dropdown的数据
    setValue(name, val){
        this.keys[name] = val
    },

    getValue(name){
        return this.keys[name]
    },

    remove(name) {
        delete this.list[name]
        delete this.instance[name]
    }

}

g_dropdown.init()
// let dropdown = g_dropdown.register('test', {
//     position: 'end',
//     offsetLeft: 30,
//     offsetTop: 0,
//     onShow: function(){

//     },
//     list: [{
//             title: 'menu1',
//             icon: 'download',
//             action: 'action1',
//         },
//         {
//             title: 'menu2',
//             icon: 'world',
//             action: 'action2',
//         }
//     ]
// })

// $(function() {
//     // setTimeout(() => dropdown.show(getEle('test')), 100)
// });