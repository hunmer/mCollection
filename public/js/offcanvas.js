var g_offcanvas = {
    list: {},
    init() {

    },
    register(name, opts) {
        this.list[name] = opts;
        this.update(name)
    },

    get(name) {
        return this.list[name];
    },

    hide(name) {
        let div = this.getEle(name)
        if (div.hasClass('show')) {
            bootstrap.Offcanvas.getOrCreateInstance(div[0]).hide()
        }
    },

    isShown(id) {
        return $('#offcanvas_' + id).hasClass('show');
    },

    getEle(id) {
        return $('#offcanvas_' + id);
    },

    update(name) {
        let d;
        if (typeof(name) == 'string') {
            d = this.get(name);
        } else
        if (typeof(name) == 'object') {
            d = name;
            name = d.name;
        }
        if (d) {
             d = Object.assign({
                once: true,
                title: '',
                class: 'offcanvas-start',
                scroll: true,
                backdrop: true
            }, d);
            let div = this.getEle(name)
            if (!div.length) {
                div = $(`
				<div class="offcanvas ${d.class}" tabindex="-1" id="offcanvas_${name}" data-bs-scroll="${d.scroll}" data-bs-backdrop="${d.backdrop}" >
	              <div class="offcanvas-header">
	                <h5 class="offcanvas-title"></h5>
	                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
	              </div>
	              <div class="offcanvas-body">
	                
	              </div>
	            </div>
			`).appendTo('body')
                    .on('show.bs.offcanvas', function(e) {
                        d.onShow && d.onShow(div)
                    })
                    .on('hide.bs.offcanvas', function(e) {
                        d.onHide && d.onHide(div);
                        if (d.once) this.remove();
                    })
                new bootstrap.Offcanvas(div[0])
            }
            d.width && div.css('width', d.width)
            div.find('.offcanvas-title').html(d.title);
            div.find('.offcanvas-body').html(typeof(d.html) == 'function' ? d.html() : d.html);
        }
    },

    show(name) {
        let div = this.getEle(name)
        if (!div.hasClass('show')) {
            bootstrap.Offcanvas.getInstance(div[0]).show()
        }
    },
}

g_offcanvas.init();