var g_toast = {
    init() {

    },
    list: {},

    register(id, opts) {
        this.list[id] = Object.assign({

            onParse: d => {
                let level = [
                    ['primary', 'blue'],
                    ['danger', 'red'],
                    ['secondary', 'yellow'],
                    ['success', 'green']
                ].find(k => k[0] == d.level)[1] || 'primary'
                return `
                      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false" data-bs-toggle="toast">
                        <div class="toast-header bg-${level} text-light">
                            ${d.icon ? (d.icon.startsWith('ti') ? `<i class="me-2 ti ${d.icon}"></i>` : `
                                <span class="avatar avatar-xs me-2" style="background-image: url(${d.icon})"></span>
                                `) : ''}
                          <strong class="me-auto">${d.title}</strong>
                          <small>${d.tips}</small>
                          <button type="button" class="ms-2 btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                        <div class="toast-body bg-dark text-light">
                         ${d.text}
                        </div>
                      </div>
                `
            }
        }, opts)
        return this
    },

    get(id) {
        return this.list[id]
    },

    tip(id, opts) {
        let d = this.get(id)
        if (!d) return;

        opts = Object.assign({
            icon: 'ti-alert-circle',
            title: '提示',
            level: 'primary',
            tips: '',
            text: '',
            timeout: 3000,
        }, opts)

        let h = d.onParse(opts)
        if (!isEmpty(h)) {
            let toast = $(h).appendTo(d.selector)
            setTimeout(() => toast.remove(), opts.timeout)
        }
    },

    toast(text, title, level) {
        g_toast.tip('default', {
            title: title || '提示',
            text: text,
            level: level || 'primary'
        })

    },

    unregister(id) {
        let d = this.get(id)
        if (!d) return;

        $(d.selector).html('')
        delete this.list[id]
    }

}

g_toast.init()
$(`<div id="toast" class="position-fixed" style="z-index: 9999;right: 20px;top: 35px;min-width: 200px;"></div>`).appendTo('body')
g_toast.register('default', {
    selector: '#toast',
})
// g_toast.toast('title', 'test', 'danger')
// g_toast.tip('default', {
//     title: '标题',
//     tips: '...',
//     level: 'danger'
// })

function toast(title, level){
    g_toast.toast(title, '提示', level)
}