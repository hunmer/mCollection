var g_style = {
	list: {},
	init(){

	},
	remove(name){
		let style = this.get(name);
		if(style){
			style.remove();
			delete this.list[name];
		}
	},
	has(name){
		return typeof(this.get(name)) != 'undefined';
	},
	get(name){
		return this.list[name];
	},
	addStyle(name, style){
		this.remove(name);
		if(!isEmpty(style)){
			let css = $(`<style alt="${name}">${style}</style>`).appendTo('html')
			this.list[name] = css;
			return css;
		}
	},
	getSheet(name){
		for(let sheet of document.styleSheets){
			if(sheet.ownerNode.getAttribute('alt') == name){
				return sheet
			}
		}
	},
	getStyle(name, selector){
		for(let rule of g_style.getSheet(name).cssRules){
			if(rule.selectorText == selector){
				return rule.style
			}
		}
	},
	setDisable(disabled){
		this.getSheet(name).disabled = disabled
	},

}

g_style.init();


