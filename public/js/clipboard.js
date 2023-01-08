var g_clipboard = {
    init() {
        const self = this
        this.lastURL = getConfig('clipboard_lastURL', '')
        typeof(nodejs) != 'undefined' && setInterval(() => self.call('interval'), 500)
    },
    //https://v.douyin.com/rXJMxCc/ 
    // https://www.douyin.com/user/MS4wLjABAAAABrCgQty2EbdlSZm13n9MFaL08Ae9QKJKcdY691wwDXnrvM8jz_qcjNbYlWxFs219
    call(eventName) {
        let s = getClipboardText();
        if(s == this.lastURL) return
        this.list.forEach(({ rule, callback, event, lastText }, i) => {
            if (event == eventName && lastText != s) {
                this.list[i].lastText = s
                let ret
                if (typeof(rule) == 'function') {
                    ret = rule(s)
                } else
                if (Array.isArray(rule)) {
                    ret = cutString(s, rule[0], rule[1], 0, rule[2]);
                } else {
                    ret = ret.test(s)
                }
                if (ret) {
                    setConfig('clipboard_lastURL', s)
                    this.lastURL = s
                    callback(ret, s)
                }
            }
        })
    },

    list: [],
    register(opts) {
        this.list.push(opts)
    },

}

g_clipboard.init()

function getClipboardText() {
    return typeof(nodejs) != 'undefined' ? nodejs.clipboard.readText() : '';
}