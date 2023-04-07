
var g_filter = {
    list: {},
    
    init() {
        const self = this
        g_action.registerAction({
            filter_click(dom, action){
                self.filter_get(action[1]).dropdown.show(dom.parentElement, 'start-bottom')
            }
        })
    },

    opts: {},
    filter_set(k, opts) {
        this.list[k] = opts

        let id = 'filter_'+k
        opts.id = id
        opts.name = k
        opts.dropdown = new _DropDown(id, {
            width: '350px',
            alwaysHide: true,
            html: `<div id="${id}" class="p-2 dropdown_content"></div>`,
            onShown(){
                opts.onShow && opts.onShow()
            },
            onHide(){
                opts.onHide && opts.onHide()
            },
        })
        opts.init()
        this.update()
    },

    setOpts(k, v) {
        return setObjVal(this.opts, k, v)
    },

    getOpts(k, def) {
        return getObjVal(this.opts, k) || def
    },

    filter_getEle(name) {
        return $('#_filter_' + name)
    },

    filter_update(name) {
        this.filter_getEle(name).replaceWith(this.filter_getHTML(name))
    },

    filter_get(name) {
        return this.list[name]
    },

    filter_getHTML(name, item) {
        if (!item) item = this.filter_get(name)
        return  `
            <div id="_filter_${name}" class="p-2">
             <a class="nav-link dropdown-toggle" data-action="filter_click,${name}" data-bs-toggle="tooltip" data-bs-placement="top" title="${item.desc}">
                 ${item.icon ? `<i class="ti ti-${item.icon}"></i>` : ''}
                ${item.title || ''}
                <span class="badge bg-primary ms-2 hide1"></span>
             </a>
            </div>
        `
    },

    update(data = {}) {
        g_filter.setOpts('filter', data)
        let h = ''
        for (let [name, item] of Object.entries(this.list)) {
            h += this.filter_getHTML(name, item)
        }
        let div = $('#filters').html(h)
        typeof(bootstrap) != 'undefined' && div.find('[data-bs-toggle="tooltip"]').each((i, el) => new bootstrap.Tooltip(el))
    }


}

g_filter.init()