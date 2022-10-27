var g_style = {
	list: {},
	init: function(){

	},
	removeStyle: function(name){
		var style = this.getStyle(name);
		if(style){
			style.remove();
			delete this.list[name];
		}
	},
	hasStyle: function(name){
		return typeof(this.getStyle(name)) != 'undefined';
	},
	getStyle: function(name){
		return this.list[name];
	},
	addStyle: function(name, style){
		this.removeStyle(name);
		if(typeof(style) == 'string' && style.length){
			var css = insertStyle(style);
			this.list[name] = css;
			return css;
		}
	}
}

g_style.init();