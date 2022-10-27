var g_menu = {
    down: {},
    list: {},
    init: function() {
        this.style = $(`<style>
            ._menu {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 99999;
                display: none;
            }
        </style>`).appendTo('body') 
    },
    // 构造菜单
    buildItems: function(list) {
        let h = ''
        for (let item of list) {
            h += item.html || `
                <a class="list-group-item list-group-item-action ${item.class}" aria-current="true" data-action="${item.action}">
                  ${item.icon ? `<i class="ti ti-${item.icon} mr-2 ${item.icon_class || ''}"></i>` : ''}${item.text}
                </a>
            `
        }
        return `<div class="list-group list-group-flush">${h}</div>`
    },
    // 隐藏菜单
    hideMenu: function(key) {
        let menu = this.getMenu(key)
        delete g_menu.key
        delete this.target
        $('#rm_' + key).hide();
        menu.onHide && menu.onHide()
    },
    // 注销菜单
    unregisterMenu: function(name) {
        delete g_menu.list[name];
    },
    // 注册菜单
    registerMenu: function(opts) {
        opts = Object.assign({
            css: '',
            overlayer: false,
        }, opts)
        this.list[opts.name] = opts;
        let id = 'rm_' + opts.name;

        if(opts.overlayer) opts.css += 'background-color: rgba(0, 0, 0, .5);'

        let div = $(`
            <div id="${id}" class="_menu" style="${opts.css}" oncontextmenu="g_menu.hideMenu('${opts.name}')">
                <div class="menu bg-white row position-absolute border rounded w-auto" style="min-width: 150px;" >
                    ${opts.html}
                </div>
            </div>
        `)
            .on('click', function(e) {
                let child = $(this).find('.menu');
                if (event.target == this) {
                    let x = event.clientX;
                    let y = event.clientY;
                    let l = child.offset().left;
                    let t = child.offset().top;
                    if (!(x >= l && x <= l + child.width() && y >= t && y <= t + child.height())) {
                      this.oncontextmenu()
                    }
                    clearEventBubble(e)
                }

            })
            .on('oncontextmenu', function(e) {
                this.style.display = 'none'
            })
            .appendTo('body');

        this.registerContextMenu(opts.selector, (dom, event) => {
            this.showMenu(opts.name, dom, event);
        });
    },
    // 获取菜单
    getMenu: function(name) {
        return this.list[name];
    },

    // 展示菜单
    // TODO 更加简洁的写法
    showMenu: function(name, dom, event) {
        let opts = g_menu.getMenu(name);
        let id = 'rm_' + opts.name;
        let key;

        if (typeof(opts.dataKey) == 'function') {
            key = opts.dataKey(dom)
        } else
        if (dom) {
            key = dom.attr(opts.dataKey);
        }
        g_menu.target = dom;
        g_menu.key = key;
        opts.onShow && opts.onShow(key);

        let par = $('#' + id).attr('data-key', key).show();
        let div = par.find('.menu');
        let i = div.width() / 2;
        let x = event.pageX;
        let mw = $(window).width();
        if (x + i > mw) {
            x = mw - div.width();
        } else {
            x -= i;
            if (x < 30) x = 30;
        }

        // let y = event.pageY + 20;
        let y = event.pageY;
        let h = div.height();
        let mh = $(window).height();
        if (mh - y < h) {
            y -= h;
        }

        div.css({
            left: x + 'px',
            top: y + 'px',
        });
    },

    // 底层方法
    registerContextMenu: function(selector, callback) {
        let down = this.down;
        $('body')
            .on('touchstart', selector, function(event) {
                let dom = $(this);
                down.start = getNow();
                down.element = dom;
                down.task = setTimeout(function() {
                    if (down.start > 0) {
                        down.holding = true;
                        event.originalEvent.preventDefault(true);
                        event.originalEvent.stopPropagation();
                        callback(down.element, event);
                    }
                    down.start = 0;
                    down.task = -1;

                }, 1500);
            })
            .on('touchend', selector, function(event) {
                if (down.task != -1) {
                    clearTimeout(down.task);
                }
                down.start = 0;
                if (down.holding) {
                    event.originalEvent.preventDefault(true);
                    event.originalEvent.stopPropagation();
                }
                down.holding = false;
            })
            .on('contextmenu', selector, function(event) {
                let dom = $(this);
                event.originalEvent.preventDefault(true);
                event.originalEvent.stopPropagation();
                down.element = dom;
                callback(down.element, event);
            });
    }
}

g_menu.init();