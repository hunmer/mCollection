var g_mark = new basedata({
    name: 'mark',
    event: true,
    list: local_readJson('marks', {}),
    saveData: data => local_saveJson('marks', data),
    insertDefault() {
        return {
            date: new Date().getTime()
        }
    },
    init() {
        const self = this
        g_style.addStyle('mark', `
            .mark_word {
                color: #fff;
                background-color: var(--tblr-primary);
            }
        `)

        self.list = local_readJson('marks', []);
        self.refresh()

        g_plugin.registerEvent('mark_set', ({ key, vals }) => {
            self.setRangeMark(vals)
        })

        g_plugin.registerEvent('mark_reset', () => {
            $('.mark_word').removeClass('mark_word')
        })

        g_plugin.registerEvent('mark_remove', ({ key, vals }) => {
            self.setRangeMark(vals, false)
        })

        $(document).on('click', '.mark_word', function(e) {
            // 点击选中并弹出选项
            let key = getParentAttr(this, 'data-chapter')
            let { min, max } = getSiblings(this)
            if (min && max) {
                window.getSelection().setBaseAndExtent(g_content.getWord(key, min)[0], 0, g_content.getWord(key, max)[0], 0) // 选中范围元素

                g_content.selectedText = g_content.getSelectText()
                g_content.onSelectedText('selected')
            }
        })
    },

    loadMarks(key) {
        this.entries((k, item) => {
            if (item.key == key) {
                this.setRangeMark(item)
            }
        })
    },

    setRangeMark(item, show = true) {
        let { start, end, key } = item
        console.log(item)
        $(g_content.getRangeDoms(key, start, end))[show ? 'addClass' : 'removeClass']('mark_word')
    },

})

// 获取相邻元素的index
function getSiblings(dom, selector = '.mark_word') {
    let el = $(dom),
        min = dom.dataset.index,
        max = min
    let doms = []
    while (true) {
        el = el.prev(selector)
        let index = el.data('index')
        if (index == undefined) break;
        min = Math.min(index, min)
    }
    el = $(dom)
    while (true) {
        el = el.next(selector)
        let index = el.data('index')
        if (index == undefined) break;
        max = Math.max(index, max)
    }

    return { min, max }
}