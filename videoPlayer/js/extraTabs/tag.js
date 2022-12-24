var g_tag = {
    selected: [],
    init() {
        const self = this
        const hideBadges = () => $('#tag_list label .badge').addClass('hide1')
        g_action.registerAction({
            tag_input() {
                self.refresh()
            },
            tag_input_keyup() {
                hideBadges()
            },
            tag_input_keydown(dom, a, e) {
                let key = e.originalEvent.key
                if (key == 'Enter') self.tag_input(dom.value)
                let badges = $('#tag_list label .badge').slice(0, 9)
                if (e.ctrlKey) {
                    if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
                        badges[key - 1].click()
                        hideBadges()
                        self.clearInput(true)
                    } else {
                        badges.each((i, el) => $(el).html(i + 1).removeClass('hide1'))
                    }
                }
            },
            tag_toggle(dom) {
                self.tag_toggle(dom.value)
            }
        })

        g_hotkey.hotkey_register({
            'digit3': {
                title: '聚焦标签',
                content: "$('#input_tags').focus()",
                type: 2,
            }
        })
        self.initTags()

        g_plugin.registerEvent('loadClip', ({ clip }) => {
            self.tag_selected(clip.tags)
        })
        g_plugin.registerEvent('addClip', ({ clip }) => {
            let t = $('#input_tags').val()
            if (t != '') { // 标签输入框残留内容尝试输入
                self.tag_input(t)
            }
        })
        g_plugin.registerEvent('loadClips', ({ data }) => {
            // TODO 定时刷新？按键刷新？
            $('#tag_container').html(`
            <div class="input-icon">
              <input type="text" value="" id="input_tags" class="form-control form-control-rounded" placeholder="搜索..." data-input="tag_input" data-keydown="tag_input_keydown" data-keyup="tag_input_keyup">
              <span class="input-icon-addon">
                <i class="ti ti-search fs-2"></i>
              </span>
            </div>
            <div id="tag_list" class="form-selectgroup pt-3 p-1 overflow-y-auto align-content-start" style="height: 250px;"></div>

        `).find('input')
                .on('focus', () => g_player.getPlayer().tryPause())
            // .on('blur', () => g_player.getPlayer().tryPlay());

            $.getJSON('http://127.0.0.1:41597/tags', (tags, textStatus) => {
                if (!tags) tags = []
                if (textStatus == 'success') {
                    self.save(tags) // 保存库标签
                }
                // 添加片段自带标签
                data.forEach(clip => {
                    if (!clip.tags) clip.tags = []
                    tags.push(...clip.tags)
                })
                self.initTags(tags)
            });
        })
    },

    tag_input(tag) {
        if (isEmpty(tag)) return
        $('#input_tags').val('')
        if (new RegExp("^[a-zA-Z]+$").test(tag)) { // 全英文 默认选中第一个结果
            tag = getEle({ change: 'tag_toggle' }).val()
            // if(tag == '') return
        }
        if (this.tags.indexOf(tag) == -1) this.tags.push(tag)
        this.tag_toggle(tag)
        this.refresh()
    },

    initTags(tags) {
        if (!tags) tags = getConfig('tags', [])
        if(Array.isArray(tags)){
            this.tags = [...new Set(tags)]
            this.refresh()
        }
       
    },

    history: local_readJson('tag_history', {}),
    tag_toggle(tag, clear = true) {
        let i = this.selected.indexOf(tag)
        if (i == -1) {
            this.selected.push(tag)
        } else {
            this.selected.splice(i, 1)
        }
        this.history[tag] = new Date().getTime()
        local_saveJson('tag_history', this.history)
        clear && this.clearInput()
    },

    tag_selected(tags) {
        this.selected = tags
        this.refresh()
    },

    save(tags) {
        setConfig('tags', tags || this.tags)
    },

    reset() {
        this.selected = []
        this.clearInput()
    },

    clearInput(focus = false) {
        let input = getEle({ input: 'tag_input' }).val('')
        this.refresh()
        input[focus ? 'focus' : 'blur']()
    },

    refresh() {
        let h = ''
        let s = getEle({ input: 'tag_input' }).val()
        let py = PinYinTranslate.start(s);
        let sz = PinYinTranslate.sz(s);
        this.tags.filter((key, i) => key.indexOf(s) != -1 || PinYinTranslate.start(key).indexOf(py) != -1 || PinYinTranslate.sz(key).indexOf(sz) != -1)
            .sort((a, b) => {
                // 根据标签最后选中时间排序
                return this.selected.indexOf(b) - this.selected.indexOf(a) || (this.history[b] || 0) - (this.history[a] || 0)
            }).forEach(tag => {
                h += `
              <label class="form-selectgroup-item position-relative">
                <span class="badge bg-blue badge-notification badge-pill hide1"></span>
                <input data-change="tag_toggle" type="checkbox" value="${tag}" class="form-selectgroup-input" ${this.selected.includes(tag) ? 'checked' : ''}>
                <span class="form-selectgroup-label">${tag}</span>
              </label>
            `
            })
        $('#tag_list').html(h)
    }
}

g_tag.init()