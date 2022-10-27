var g_action = {
    list: {},
    init: function() {
        const self = this
        let doAction = (dom, action, event) => {
            if (dom.classList.contains('disabled')) return;
            self.do(dom, action, event)
        }

        $(document)
            .on('mouseenter', '[data-hover]', function(event) {
                this.hoverTimer = setTimeout(() => {
                    delete this.hoverTimer
                    doAction(this, this.dataset.hover, event);
                }, this.dataset.hoverTime || 0)
            })
            .on('mouseleave', '[data-out]', function(event) {
                if (this.hoverTimer) {
                    clearTimeout(this.hoverTimer)
                    delete this.hoverTimer
                }
                doAction(this, this.dataset.out, event);
            })
            .on('click', '[data-url]', function(event) {
                ipc_send('url', this.dataset.url)
            })
            .on('click', '[data-action]', function(event) {
                doAction(this, this.dataset.action, event);
            })
            .on('dblclick', '[data-dbclick]', function(event) {
                doAction(this, this.dataset.dbclick, event);
            })
            .on('change', '[data-change]', function(event) {
                doAction(this, this.dataset.change, event);
            })
            .on('input', '[data-input]', function(event) {
                doAction(this, this.dataset.input, event);
            })
            .on('keydown', '[data-keydown]', function(event) {
                doAction(this, this.dataset.keydown, event);
            })
            .on('keyup', '[data-keyup]', function(event) {
                doAction(this, this.dataset.keyup, event);
            })
            .on('contextmenu', '[data-contenx]', function(event) {
                doAction(this, this.dataset.contenx, event);
                clearEventBubble(event);
            })
           
    },
    registerAction: function(name, callback) {
        let isArr = Array.isArray(name)
        if (typeof(name) == 'object' && !isArr) {
            Object.assign(this.list, name)
            return this
        }

        if (!isArr) name = [name];
        for (var alisa of name) this.list[alisa] = callback;
        return this
    },

    do(dom, action, event) {
        // input 不关闭
        // if (!dom || !dom.nodeName == 'INPUT' && typeof(bootstrap) != 'undefined') bootstrap.Dropdown.clearMenus()
        var action = action.split(',');
        if (this.list[action[0]]) {
            return this.list[action[0]](dom, action, event);
        }

        switch (action[0]) {
            case 'resetData':
                confirm('你确定要重置数据吗', {
                    callback: btn => {
                        local_clearAll();
                        location.reload();
                    }
                })
                break;
        }
    }

}

g_action.init()

