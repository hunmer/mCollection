var g_range = {
    selected: new Set(),
    init(opts) {
        const self = this
        self.opts = opts
        g_style.addStyle('range', `
            .folder_selected,
            .item_selected {
                border: 4px solid #206bc4 !important;
            }
            .tag_selected {
                color: #fff !important;
                background: #206bc4 !important
            }
        `)
        self.div = $(`<div id="selectDiv" style="position:absolute;width:0px;height:0px;font-size:0px;margin:0px;padding:0px;border:1px dashed #0099FF;background-color:#C3D5ED;z-index:999999;filter:alpha(opacity:60);opacity:0.6;display:none;pointer-events:none;">`).appendTo('body')

        $(window).on('click', function(e){
            let time = e.timeStamp
            if(time - self.lastClick <= 400 && self.currentClass){
                self.selected.forEach(d => d.classList.remove(self.currentClass)) 
                clearEventBubble(e)
                delete self.currentClass
                return false
            } // 双击
            self.lastClick = time
        }).on('mousedown', function(e) {
            delete self.current
            // ? 用dragable
            if (!$(e.target).parents('[data-file]').length) { // 可拖拽的对象取消
                self.moving = true
                self.sx = e.screenX
                self.sy = e.screenY
            }
        }).on('mouseup', function(e) {
            self.moving = false
            self.hide()
            self.get(self.current)?.onEnd()
            delete self.current
        }).on('mousemove', function(e) {
            if (self.moving) {
                let { clientX, clientY } = e
                self.ex = e.screenX
                self.ey = e.screenY
                if(Math.abs(self.ex - self.sx) < 20 && Math.abs(self.ey - self.sy) < 20) return; // 最少 
                self.update()

                let area = self.div[0].getBoundingClientRect()
                // if(self.firstScrollTop != undefined){
                //     let offset = self.scrollTop - self.firstScrollTop
                //     area.top = self.firstScrollTop
                //     area.bottom += offset
                // }
              
                Object.keys(self.list).every(name => {
                    if (self.current != undefined && self.current != name) return true; // 放开之前只能选择一个组

                    let cnt = 0
                    let opts = self.list[name]
                    $(opts.selector).each((i, dom) => {
                        let rect2 = dom.getBoundingClientRect()
                        // 更改为相对于滚动条的高度
                        // rect2.top = dom.offsetTop
                        // rect2.bottom = dom.offsetTop + rect2.height

                        let b = isElementInArea(rect2, area)
                        if(typeof(opts.target) == 'function'){ // class应用在其他元素上
                            dom = opts.target(dom)
                        }
                        dom.classList.toggle(opts.class, b)
                        if (b) {
                            cnt++
                            self.selected.add(dom)
                            self.current = name
                            self.currentClass = opts.class
                        }
                    })
                    return cnt === 0
                })

                let _y = e.screenY;
                let par = $(e.target).closest('.overflow-y-auto')[0] // 取可滚动的元素
                if (par) {
                    let { top, height } = par.getBoundingClientRect()
                    let offset = height * 0.25
                    if (_y - offset <= top) {
                        par.scrollBy(0, -10)
                    } else
                    if (_y + offset >= height) {
                        par.scrollBy(0, 10)
                    }
                }
            }

        })
    },
    list: {},
    add(list) {
        this.list = Object.assign(this.list, list)
    },
    get(name) {
        return this.list[name]
    },

    hide(){
        this.moving = false
        this.div.hide()
        this.div.appendTo('body') // 还原到body
        // this.offsetY = 0
        // this.offsetX = 0
        // this.scrollTop = 0
        this.sx = 0
        this.sy = 0
        this.ex = 0
        this.ey = 0
        // this.firstScrollTop = undefined
    },

    offsetY: 0,
    offsetX: 0,
    update() {
        let css = {
            display: 'unset',
        }
        css.left = Math.min(this.sx, this.ex) - this.offsetX
        css.width = Math.abs(this.sx - this.ex)
        css.top = Math.min(this.sy, this.ey)  - this.offsetY
        css.height = Math.abs(this.sy - this.ey)
        this.div.css(css)
    },

}

g_range.init({

})

g_range.add({
    datalist_item: {
        selector: '.datalist-items .datalist-item',
        class: 'item_selected',
        onEnd: () => g_item.selected_update()
    },
    folder: {
        selector: '[data-list="folder"]',
        class: 'folder_selected',
    },
    tags: {
        selector: '[data-action="tag_edit"]',
        target: d => $(d).parents('.badge')[0],
        class: 'tag_selected',
    }
})

function isElementInArea(rect1, rect2) {
    // return rect.left >= area.left && rect.right <= area.right && rect.top >= area.top && rect.bottom <= area.bottom; // 完全在范围内
    return !(rect1.bottom < rect2.top || rect1.top > rect2.bottom || rect1.right < rect2.left || rect1.left > rect2.right) // 有一部分在范围
}