var g_ui = {

	init(){
		const self = this
		g_action.registerAction({
			ui(dom, action, e){
				self.show(action[1])
			}
		})
	},

	list: {},
	register(id, opts){
        opts = Object.assign({
            onHide: hide => {}
        }, opts)
		opts.ele = $(`<div data-ui="${id}" class="ui hide ${opts.class || ''}">${opts.html}</div>`).appendTo(opts.container)
		this.list[id] = opts
		return opts.ele
	},

	get(id){
		return this.list[id]
	},

	group_items(group){
		let r = []
		this.entries((k, v) => {
			if(v.container == group){
				r.push(k)
			}
		})
		return r
	},

	entries(callback){
		for(let [k, v] of Object.entries(this.list)){
			if(callback(k, v) === false) return
		}
	},

    getEle(ui){
        return getEle({ui}, '.ui')
    },

	show(id){
		let d = this.get(id)
		this.group_items(d.container).forEach(k => {
            let hide =  k != id
			this.getEle(k).toggleClass('hide', hide)
            d.onHide(hide)
            let btn = getEle('ui,'+id)
            if(!btn.length){
            	switch(id){
	            	case 'account':
	            	case 'tbgz':
	            		btn = $('#dropdown_nav_account')
	            		break;
	            }
            }
            $('.ui_btn_active').removeClass('ui_btn_active')
            btn.addClass('ui_btn_active')
		})
	},

    ele(id){
        return this.list[id].ele
    },

	switch(){

	},

}

g_ui.init()
