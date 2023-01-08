

class basedata {
	insertDefault = {}
	constructor(opts){
		Object.assign(this, opts)
		this.isArr = Array.isArray(opts.list)
		this.init && this.init()
	}

    toggle(key, vals) {
        if (this.exists(key)) {
            this.remove(key)
        } else {
            this.add(key, vals)
        }
    }

    add(key, vals = {}, save = true) {
        this.set(key, vals, save);
    }

    exists(key) {
        return this.get(key) != undefined
    }

    all(callback) {
        return Object.entries(this.list).filter(callback)
    }

    set(key, vals = {}, save = true) {
        let exists = this.exists(key)
        if(!exists){
            if(this.isArr) key = this.list.length
        }
        vals = Object.assign(toVal(this.insertDefault), vals);
        this.list[key] = vals
        save && this.save();

        this.callEvent(this.name + '_set' , { key, vals, exists })
    }

    callEvent(...args){
    	this.event && g_plugin.callEvent.apply(g_plugin, args)
    }

    find(key, method = 'findIndex') {
    	if(this.isArr) return this.list[method](item => item.value == key)
    	if(method == 'find') return this.list[key]
    	return key
    }

    get(key) {
        return this.find(key, 'find');
    }

    reset() {
        this.list = this.isArr ? [] : {}
        this.save()
        this.callEvent(this.name + '_reset')
    }

    remove(key) {
        let vals = this.get(key)
        if (vals) {
            key = this.find(key)
            this.isArr ? this.list.splice(key, 1) : delete this.list[key]
            this.save();
        	this.callEvent(this.name + '_remove' , { key, vals })
        }
    }

    save(refresh = true, list) {
    	this.saveData(list || this.list)
        refresh && this.refresh();
    }

    entries(callback) {
        for (let [k, v] of Object.entries(this.list)) {
            if (callback(k, v) === false) return
        }
    }

    refresh(){

    }
}
