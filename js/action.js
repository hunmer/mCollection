var g_action = {
    list: {
        openFile(dom){
            nodejs.files.openFile(dom.dataset.file)
        }
    },
    hover: {},
    clearTimeout(action){
        if(this.hover[action]){
            clearTimeout(this.hover[action])
            delete this.hover[action]
        }
    },
    init: function() {
        const self = this
        let doAction = (dom, action, event) => {
            if (dom.classList.contains('disabled')) return;
            self.do(dom, action, event)
        }

        $(document)
            .on('mouseenter', '[data-hover]', function(event) {
                let action = this.dataset.hover
                self.clearTimeout(action)
                self.hover[action] = this.hoverTimer = setTimeout(() => doAction(this, action, event), this.dataset.hovertime || 0)
            })
            .on('mouseleave', '[data-out]', function(event) {
                self.clearTimeout(this.dataset.hover || this.dataset.outfor)
                doAction(this, this.dataset.out, event);
            })
            .on('click', '[data-url]', function(event) {
                ipc_send('url', this.dataset.url)
            })
            .on('click', '[data-action]', function(event) {
                doAction(this, this.dataset.action, event);
            })
            .on('mousedown', '[data-mousedown]', function(event) {
                if(event.which == 1){ // 左键
                    doAction(this, this.dataset.mousedown, event);
                }
            })
            .on('mouseup', '[data-mouseup]', function(event) {
                if(event.which == 1){ // 左键
                    doAction(this, this.dataset.mouseup, event);
                }
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
            .on('keydown',  e => { // 回车键会触发焦点的action
                if (e.keyCode == 13) {
                    let active = document.activeElement
                    let action = active.dataset.action
                    if (!isEmpty(action)) {
                        active.click()
                        clearEventBubble(e);
                    }
                }
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


function doAction(action, dom, e) {
    g_action.do(dom, action, e)
}