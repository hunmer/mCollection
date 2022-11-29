var g_offcanvas = {
	list: {},
	init: function(){

	},
	register: function(name, opts){
		this.list[name] = opts;
	},

	get: function(name){
		return this.list[name];
	},

	hide: function(name){
		var div = $('#offcanvas_'+name);
		if(div.hasClass('show')){
			bootstrap.Offcanvas.getOrCreateInstance(div[0]).hide()
		}
	},

	isShown: function(id){
		return $('#offcanvas_'+id).hasClass('show');
	},

	show: function(name){
		var d;
		if(typeof(name) == 'string'){
			d = this.get(name);
		}else
		if(typeof(name) == 'object'){
			d = name;
			name = d.name;
		}
		if(d){
			var d = Object.assign({
				once: true,
				title: '',
				class: 'offcanvas-start',
				scroll: true,
				backdrop: true
			}, d);
			var id = 'offcanvas_'+name;
			var div = $('#'+id);
			if(!div.length) div = $(`
				<div class="offcanvas ${d.class}" tabindex="-1" id="${id}" data-bs-scroll="${d.scroll}" data-bs-backdrop="${d.backdrop}" >
	              <div class="offcanvas-header">
	                <h5 class="offcanvas-title"></h5>
	                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
	              </div>
	              <div class="offcanvas-body">
	                
	              </div>
	            </div>
			`).appendTo('body')
			.on('show.bs.offcanvas', function(e){
				d.onShow && d.onShow()
			})
			.on('hide.bs.offcanvas', function(e){
				d.onHide && d.onHide();
				if(d.once) this.remove();
			})
			div.find('.offcanvas-title').html(d.title);
			div.find('.offcanvas-body').html(typeof(d.html) == 'function' ? d.html() : d.html);
			if(!div.hasClass('show')) new bootstrap.Offcanvas(div[0]).show();
		}
	},
}

g_offcanvas.init();

