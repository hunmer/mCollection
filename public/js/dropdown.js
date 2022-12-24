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
        let items = typeof(this.opts.list) == 'function' ? this.opts.list() : this.opts.list
        for (let [n, item] of Object.entries(items)) {
            if (item.type == 'divider') {
                h += `<div class="dropdown-divider"></div>`
                continue
            }

            let childrens = g_dropdown.getChildrens(this.name, n)
            // data-hover="dropdown_subMenu" data-hoverTime="500"
            h += item.html || `<li>
                <a class="dropdown-item ${item.class || ''}" ${childrens.length ? 'data-action="dropdown_subMenu"' : ''} data-action="${item.action || ''}" data-name="${n}" ${item.attr || ''}>
                    ${item.icon ? `<i class="me-2 ti ti-${item.icon}"></i>` : ''}
                    ${item.title}

                    ${childrens.length ? `<i class="ti ti-arrow-narrow-right position-absolute end-0"></i>` : ''}
                </a>
            </li>`
        }
        return `
        <div class="_dropdown" oncontextmenu="g_dropdown.hide('${this.name}')" id="_dropdown_${this.name}" data-dropdown="${this.name}" data-autoClose="${this.opts.autoClose}">
           <ul class="dropdown-menu d-block position-absolute">
            ${h}
         </ul>
       </div>`
    }

    init() {
        return $(this.render()).appendTo('html')
    }

    show(e, p) {
        let div = this.getElement()
        if (!div.length) div = this.init()

        let menu = div.css({
                // left: -1000, // 先插入 由此获得div大小
                zIndex: ++g_dropdown.zIndex,
            }).addClass('show')
            .find('.dropdown-menu').css({
                width: this.opts.width || 'unset',
                height: this.opts.height || 'unset',
            })

        let { rect, key } = e
        if (e instanceof HTMLElement || e instanceof jQuery) { // 为元素
            e = $(e)
            g_dropdown.target = e
            let f = this.opts.dataKey
            if (f && e.length) key = typeof(f) == 'function' ? f(e) : e.attr(opts.dataKey)
            rect = e[0].getBoundingClientRect()
        }
        g_dropdown.setValue(this.name, key)
        this.opts.onShow && this.opts.onShow.apply(this, e)

        let rect1 = menu[0].getBoundingClientRect()
        let left, top;
        let css = {}
        for (let pos of (p || this.opts.position || 'end').split('-')) {
            switch (pos) {
                case 'centerX':
                    left = rect.left - rect1.width / 2
                    break;
                case 'centerY':
                    top = rect.top - rect1.height / 2
                    break;
                case 'start':
                    left = rect.left - rect1.width
                    break;
                case 'end':
                    left = rect.left + rect.width
                    break;
                case 'top':
                    top = rect.top
                    break;
                case 'bottom':
                    top = rect.top + rect.height
                    break;
            }
        }
        left += this.opts.offsetLeft || 0
        top += this.opts.offsetTop || 0
        let maxW = window.innerWidth
        let maxH = window.innerHeight
        css.left = Math.max(0, Math.min(left, maxW))
        css.top = Math.max(0, Math.min(top, maxH))
        if (css.top + rect1.height > maxH) css.top = maxH - rect1.height
        if (css.left + rect1.width > maxW) css.left = maxW - rect1.width

        menu.css(css)
        this.opts.onShown && this.opts.onShown.apply(this)
    }

    hide() {
        this.opts.onHide && this.opts.onHide.apply(this)
        let div = this.getElement()
        if (this.opts.alwaysHide) {
            div.removeClass('show')
            // .css('left', '-1000px')
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
    zIndex: 222,
    init() {
        const self = this

        this.style = $(`<style>
            ._dropdown {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 99999;
                display: none;
                /* background-color: rgb(4 4 4 / 30%); */
            }
            ._dropdown.dropdown-menu {
                width: 100px;
                min-width: unset !important;
                word-break: keep-all;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            ._dropdown.dropdown-menu li {
                padding: 0 6px;
            }

            ._dropdown.dropdown-menu .dropdown-item {
                padding: 2px;
            }
        </style>`).appendTo('html')

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
        on('click', '._dropdown', function(e) {
            // inside outside 判断
            for (let div of $('._dropdown.show')) { // 枚举展示中的dropdown
                let name = div.dataset.dropdown
                let menu = $(div).find('.dropdown-menu')
                let b
                switch ((div.dataset.autoclose || 'true').toString()) { // 判断点击类型
                    case 'true':
                        b = true
                        break;
                    case 'inside':
                        b = inArea(e, menu)
                        break;
                    case 'outside':
                        b = !inArea(e, menu)
                        break;
                }
                b && g_dropdown.hide(name)
            }
        })

        window.addEventListener('keydown', e => {
            if ($('input:focus,textarea:focus').length == 0) {
                if (e.key == 'Escape') {
                    self.hideAll()
                }
            }
        })

        g_action.registerAction({
            dropdown_show(dom, action, e) {
                self.show(action[1] || dom.dataset.dropdown, dom, action[2] || dom.dataset.position)
            },
            dropdown_subMenu(dom, action, e) {
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
                        let par = target.parents('._dropdown')
                        if (!par.get(0) || par.attr('data-dropdown') == group && target.attr('data-name') != name) { // 不在dropdown之内 || 不在上次元素之内
                            fun()
                        }
                    }, 1000)
                } else {
                    let menus = self.getChildrens(group) // 获取所有同级菜单
                    for (let m of menus) self.hide(m, dom) // 先隐藏所有菜单
                    fun()
                }
            },
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
    quickShow(name, pos = 'centerX-centerY') {
        g_dropdown.show(name, {
            rect: { left: g_cache.mouse.clientX, top: g_cache.mouse.clientY }
        }, pos)
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
    isShowing(name) {
        return (name == undefined ? this.getDropdowns() : this.getElement(name)).hasClass('show')
    },
    getDropdowns(){
        return $('._dropdown')
    },
    getShowing(){
        return Object.keys(this.instance).filter(k => this.isShowing(k))
    },
    hideAll(){
        this.getShowing().forEach(k => this.hide(k))
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
    setValue(name, val) {
        this.keys[name] = val
    },

    getValue(name) {
        return this.keys[name]
    },

    remove(name) {
        delete this.list[name]
        delete this.instance[name]
    },

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