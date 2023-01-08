/*
	多语言组件+英文翻译
	为了不混淆有些组件是用英文单词写的，但要显示中文的话还要加一些代码
	干脆直接写个全局翻译的，省事且灵活性高
*/


var g_lang = {
    list: {
    	确定: {
    		zh: '',
    		en: 'yes',
    	},
    	取消: {
    		zh: '',
    		en: 'cencel',
    	},
    	default: {
    		zh: '默认',
    		en: '',
    	},
    	folder: {
    		zh: '文件夹',
    		en: '',
    	}
    },
    init() {
    	this.lang = getConfig('lang', 'zh')
    	// this.adds({
    	// 	aa: {
	    // 		en: 'aaa',
	    // 	},
    	// })
    	// this.setLang('aa.en', 'ccc')
    	// console.log(this.getVal('aa'))
    },
    setLang(k, v){
		 setObjVal(this.list, k, v)
		 return this
	},
	getLang(k, def){
		return getObjVal(this.list, k) || def
	},
    adds(list){
    	if(typeof(list) == 'object') Object.assign(this.list, list)
    },
    getVal(k) {
        if (this.list[k] && this.list[k][this.lang]) {
            k = this.list[k][this.lang] || k // 如果留空则用主键的名称
        }
        var args = Array.from(arguments);
        args.shift(); // 去除第一个 k
        var len = args.length;
        if (len) {
            args = len == 1 && Array.isArray(args[0]) ? args[0] : args; // 如果是数组则用数组
            for (var i = 0; i < args.length; i++) {
                k = k.replace('%' + i, args[i]);
            }
            return k;
        }
        return k;
    }

}
g_lang.init()
var _l = (...args) => g_lang.getVal(args)