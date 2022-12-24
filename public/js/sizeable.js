class Sizeable {
    constructor(id, opts) {
        this.id = id
        this.opts = Object.assign({
            id,
            size: 10,
            style: {},
            change: (t, i) => {}, // 调整前(用户自定义，决定是否调整大小和保存位置)
            changed(t, i) { // 调整后
                let ret = this.change(t, i) || {}
                if (ret.resize !== false) { // 调整大小
                    $(this.selector).css(t, i + 'px')
                }
                if (ret.memory !== false && this.memory) { // 保存位置
                    g_sizeable.assign(this.id, t, i)
                }
            }
        }, opts)
        this.element().addClass('sizeable')
    }

    element() {
        return $(this.opts.selector)
    }

    show(pos, rect) {
        const self = this
        if (typeof(rect) != 'object') { // 方位
            // 获取位置obj
        }

        let h = this.opts.size
        switch (pos) {
            case 'left':
            case 'right':
                rect.width = h
                break;

            case 'top':
            case 'bottom':
                rect.height = h
                break;
        }

        let style = Object.assign({
            position: 'fixed',
            zIndex: 999,
            backgroundColor: '#206bc4',
            opacity: .3,
            cursor: (['top', 'bottom'].includes(pos) ? 's' : 'e') + '-resize'
        }, rect, this.opts.style)

        let div = $('.sizebar')
        if (div.length) {
            div.css(style) // 已存在，仅更新css属性
        } else {
            this.dragger = $(`
            <div class="sizebar" data-pos="${pos}">
            </div>
        `).css(style).appendTo('body').on('mousedown', function(e) {
                if (g_sizeable.stopDragging()) return
                setTimeout(() => {
                    g_sizeable.dragging = {
                        pos,
                        ele: this,
                        id: self.id,
                        target: self.element(),
                    }
                }, 250)
            })
        }
    }
}



var g_sizeable = {
    outCnt: 0,
    instace: {},
    inited: {}, // 已经恢复过位置的div
    stopDragging() {
        let dragging = typeof(g_sizeable.dragging) != 'undefined'
        delete g_sizeable.dragging
        $('.sizebar').remove()
        return dragging
    },
    init(funs = {}) {
        const self = this
        let init = funs.init
        if (init) {
            funs.init.apply(this)
            delete funs.init
        }
        Object.assign(this, funs)

        this.data = g_sizeable.getData('sizeable', {})
        $(window).on('mouseup', e => this.stopDragging())
            .on('mousemove', e => {
                g_cache.mouse = e.originalEvent
            })
            .on('blur', e => this.stopDragging())
        this.timer()
    },
    set(k, v, save = true) {
        this.data[k] = v
        save && this.save()
    },
    assign(id, k, v, save = true) {
        if (!this.data[id]) this.data[id] = {}
        this.data[id][k] = v
        save && this.save()
    },
    save() {
        g_sizeable.saveData('sizeable', this.data)
    },
    timer(stop = false) {
        if (stop) {
            return clearInterval(this.timer);
        }

        const getRect = (ele, pos, h) => {
            // 不要直接用rect对象，因为改变一个值其他的值也会跟着改变
            let { left, top, width, height, right, bottom } = ele.getBoundingClientRect()
            switch (pos) {
                case 'top':
                case 'bottom':
                    height = h
                    if (pos == 'bottom') top = bottom - h
                    break

                case 'left':
                case 'right':
                    width = h
                    if (pos == 'right') left = right - h
                    break;
            }
            return { left, top, width, height, right, bottom }
        }

        this.timer = setInterval(() => {
            if (g_cache.mouse) {
                // todo 仅在ctrl激活时显示
                let { x, y } = g_cache.mouse
                let dragging = g_sizeable.dragging
                if (dragging) { // 调整大小中
                    let inst = this.instace[dragging.id]
                    let opts = inst.opts
                    let target = dragging.target[0]
                    let rect = target.getBoundingClientRect()
                    let i
                    let t = ['left', 'right'].includes(dragging.pos) ? 'width' : 'height'
                    // 取拖动后大小
                    switch (dragging.pos) {
                        case 'left':
                            i = rect.right - x
                            break;

                        case 'right':
                            i = x - rect.left
                            break;

                        case 'top':
                            i = rect.top - y + rect.height
                            break;

                        case 'bottom':
                            i = rect.bottom - y
                            break;
                    }
                    let min = opts[t + '_min'] || 0
                    let max = opts[t + '_max'] || 9999
                    if (i < min) {
                        i = min
                    } else
                    if (i > max) {
                        i = max
                        this.stopDragging()
                    }
                    inst.show(dragging.pos, getRect(target, dragging.pos, opts.size)) // 更新拖动条的位置
                    opts.changed(t, i)
                } else {
                    if ($('.dropdown-menu.show').length) return // dropdown不显示
                    if (!$(g_cache.mouse.target).parents('.sizeable').length) return
                }

                for (let [id, inst] of Object.entries(this.instace)) {
                    let ele = inst.element()
                    if (ele.length) {
                        let find;
                        let { x, y } = g_cache.mouse
                        inst.opts.allow.forEach(pos => {
                            let { left, top, bottom, right, width, height } = getRect(ele[0], pos, inst.opts.size) // 取调整后的拖动条位置
                            if (x >= left && x <= left + width && y >= top && y <= top + height) {
                                if (self.showing != id) {
                                    find = id
                                    self.showing = id
                                    inst.show(pos, { left, top, bottom, right, width, height })
                                }
                                self.outCnt = 0
                                return false
                            }
                        })

                        if (!find && self.showing) {
                            if (++self.outCnt >= 6) { // 300ms后隐藏
                                $('.sizebar').remove()
                                delete self.showing
                            }
                        }
                    }
                }
            }
        }, 50)
    },
    register(id, opts) {
        let obj = new Sizeable(id, opts)
        this.instace[id] = obj
        g_sizeable.restore(id)
        return obj
    },

    restore(id) {
        // 还原上次位置
        let memory = this.data[id]
        if(memory){
        // if (this.inited[id] != memory) {
            // this.inited[id] = memory
            for (let [k, v] of Object.entries(memory)) {
                this.instace[id].opts.changed(k, v)
            }
        }
    },

}