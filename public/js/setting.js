var g_setting = {
    default: {}, 
    tabs: {},
    getTab(name) {
        return this.tabs[name]
    },

    init() {
        const self = this
        g_action.registerAction({
            settings: (dom, action) => {
                let opts = self.getTab(action[1])
                if (!opts) return

                let h = ''
                for (let [tab, item] of Object.entries(self.tabs)) {
                    h += `<li class="nav-item" role="presentation">
                             <a href='#' data-action="${item.action || 'settings,'+tab}" class="nav-link ${tab == action[1] ? 'active' : ''}" role="tab"><i class="ti ti-${item.icon} me-2"></i>${item.title}</a>
                        </li>`
                }
                
                g_form.confirm('settings', {
                    class: 'pt-0',
                    elements: Object.assign(opts.elements, {
                        tabs: {
                            html: `
                                <ul class="nav nav-tabs nav-fill" data-bs-toggle="tabs" role="tablist">
                                    ${h}
                                </ul>
                            `,
                            primary: 999,
                        },
                    }),
                }, {
                    title: '设置',
                    id: 'settings',
                    bodyClass: 'p-0',
                    btn_ok: '保存',
                    once: true,
                    onBtnClick: (btn, modal) => {
                        // TODO 怎么回调form事件？ plugin?
                        if (btn.id == 'btn_ok') {
                            for (let [k, v] of Object.entries(g_form.getChanges('settings'))) {
                                setConfig(k, v)
                            }
                        }
                        modal.remove()
                    }
                })
            },
            darkMode: dom => {
                g_setting.setConfig('darkMode', !$('body').hasClass('theme-dark'))
            }

        })

        g_setting.onSetConfig({
            darkMode: b => {
                getEle('darkMode').toggleClass('text-primary', b)
                $('body').toggleClass('theme-dark', b)
            },
        })

    },

    bind: {},
    onSetConfig(list, callback) {
        let isArr = Array.isArray(list)
        if (typeof(list) == 'object' && !isArr) {
            Object.assign(this.bind, list)
            return this
        }
        if (!isArr) list = [list]
        for (let k of list) this.bind[k] = callback
        return this;
    },

    call(k, v) {
        if (this.bind[k]) {
            return this.bind[k](v, k)
        }
    },

    // 激活配置执行的操作
    apply(list, def, check) {
        if (!check) check = v => v
        if (!Array.isArray(list)) list = [list]
        for (let k of list) {
            let v = this.getConfig(k, def)
            if (check(v) === false) continue
            this.call(k, v)
        }
        return this
    },

    setConfig(k, v) {
        g_config[k] = v;
        if (this.call(k, v) === false) return;
        local_saveJson('config', g_config);
    },

    getConfig(k, def) {
        if (Array.isArray(k)) {
            let r = {}
            for (let n of k) r[n] = g_config[n]
            return r
        }
        var v = g_config[k];
        return isEmpty(v) ? def == undefined ? this.getDefault(k) : def : v
    },

    toggleValue(k, b) {
        if (b == undefined) b = !this.getConfig(k);
        this.setConfig(k, b)
        return b
    },

    setDefault(k, v) {
        let isArr = Array.isArray(k)
        if (typeof(k) == 'object' && !isArr) {
            Object.assign(this.default, k)
        }else{
            [].concat(k).forEach(_k => this.default[k] = v)
        }
    },

    getDefault(k) {
        return this.default[k]
    }

}

var g_config = local_readJson('config', {

});


$(function() {
    g_setting.init()
});


function getConfig(k, def) {
    return g_setting.getConfig(k, def)
}

function setConfig(k, v) {
    return g_setting.setConfig(k, v)
}

 function getProxy() {
     let proxy = getConfig('proxy')
     return proxy ? { proxy, http_proxy: proxy, https_proxy: proxy } : {}
 }

