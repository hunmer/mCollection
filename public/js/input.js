var g_input = {
    init() {
        const self = this
        $(document).on('change', 'input', function(e) {
            let k = this.name
            if (self.list[k]) {
                let val
                let selected
                switch (this.type) {
                    case 'radio':
                    case 'checkbox':
                        selected = this.checked
                        val = this.value
                }
                self.call(k, { selected, val, e })
            }
        })
    },

    list: {},
    bind(name, callback) {
        let isArr = Array.isArray(name)
        if (typeof(name) == 'object' && !isArr) {
            Object.assign(this.list, name)
            return this
        }

        if (!isArr) name = [name];
        for (var alisa of name) this.list[alisa] = callback;
        return this
    },

    call(k, params) {
        this.list[k](params)
    },

    getVal(name){
        return $('[name="'+name+'"]:checked').val()
    }
}

g_input.init()