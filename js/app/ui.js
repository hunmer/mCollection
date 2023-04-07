var g_ui = {
    list: {},
    init() {
        $(`<div id="content" style="height: calc(100vh - 35px)"></div>`).appendTo('main')
    },
    register(name, opts) {
        this.list[name] = Object.assign({

        }, opts)
        this.update(name)
        return this
    },
    update(name) {
        let opts = this.get(name)
        if (opts) {
            let div = this.getElement(name)
            let h = `
    			<div class="ui" data-name="${name}" style="display: none">
    		` + (typeof(opts.html) == 'function' ? opts.html() : opts.html) + '</div>'
            if (div.length) {
                div.replaceWith(h)
            } else {
                $(h).appendTo(opts.target)
                opts.onAppend && opts.onAppend()
            }
        }
    },
    get(name) {
        return this.list[name]
    },
    getElement(name) {
        return $('.ui[data-name="' + name + '"]')
    },
    show(name) {
        let opts = this.get(name)
        if (opts) {
            let div = this.getElement(name)
            if (!div.hasClass('show')) {
                this.hide(this.getShown())
                div.addClass('show')
                opts.onShow && opts.onShow()
            }
        }
    },
    getShown() {
        return $('.ui.show')
    },
    hide(names) {
        if (typeof(names) == 'object') {
            let a = []
            for (let dom of names) a.push(dom.dataset.name)
            names = a
        } else
        if (!Array.isArray(names)) names = [names]

        for (let name of names) {
            let div = this.getElement(name)
            if (div.hasClass('show')) {
                let opts = this.get(name)
                if (opts) {
                    div.removeClass('show')
                    opts.onHide && opts.onHide()
                }
            }
        }

    },

}

g_ui.init()
