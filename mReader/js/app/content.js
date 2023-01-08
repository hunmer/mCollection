var g_content = {
    selectedText: '',
    lastChapter: '',
    init() {
        const self = this
        let lastSelectedTime
        g_style.addStyle('content', `
            .word {
                font-size: ${getConfig('fontSize', 20)}px;
            }

            .selected_word {
                border-bottom: 1px solid var(--tblr-azure)
            }
        `)
        g_ui.register('content', {
            container: '#content',
            html: `
                <div class="position-relative w-full h-full overflow-y-auto">
                    <progress class="progress progress-sm w-full positon-absolute top-0 left-0" value="15" max="100"></progress>
                    <div id="text_content" class="container hideScroll allowSelect overflow-y-auto" style="height: calc(100vh - 50px);" data-mouseup="content_mouseup">
                    </div>
                </div>

            `,
            onHide(hide) {

            },
        })

        $('#text_content').on('scroll', function(e) {
            let result = (this.scrollTop /  (this.scrollHeight - this.offsetHeight) * 100).toFixed(2)
            if (result == 100) { // 翻页
                g_source.nextPage()
            } else
            if (result == 0) {
                g_source.prevPage()
            }
            $('progress').prop('value', result);

            let el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
            if(el){
                let chapter = el.dataset.chapter
                if(chapter && chapter != self.lastChapter){
                    self.lastChapter = chapter
                    g_plugin.callEvent('onChapterChanged', {chapter, el})
                }
            }
        }).on('mousewheel', function(e){
            if(e.ctrlKey){
                let size = parseInt(getConfig('fontSize', 15))
                size += e.originalEvent.deltaY > 0 ? -1 : 1
                size = Math.max(0, Math.min(size, 30))
                setConfig('fontSize', size)
            }
        })

        g_setting.onSetConfig({
            fontSize(val){
                console.log(val)
                g_style.getStyle('content', '.word').fontSize = val + 'px'
            }
        })

        g_dropdown.register('selection', {
            position: 'top-end',
            offsetLeft: 0,
            offsetTop: 50,
            list() {
                return {
                    actions: {
                        html: `<div class="dropdown-item p-1">` + g_tabler.buildButtonGroup([
                            { title: '收藏', icon: 'bookmark' + (g_mark.exists(self.selection.text) ? ' text-primary' : ''), action: 'selection_mark' },
                            { title: '搜索', icon: 'search', action: 'selection_search' },
                            { title: '朗读', icon: 'speakerphone', action: 'selection_read' },
                            { title: '复制', icon: 'copy', action: 'selection_copy' },
                        ]) + '</div>'
                    },
                    search_result: {
                        html: `  `
                    }
                }
            },
            onHide() {
                $('.selected_word').removeClass('selected_word')
            }
        })

        g_action.registerAction({
            content_mouseup() {
                if (new Date().getTime() - lastSelectedTime >= 100) { // 单击bug
                    self.onSelectedText('selected')
                    self.selectedText = ''
                    window.getSelection().removeAllRanges()
                    self.selection && $(self.selection.doms).addClass('selected_word')
                }

            },
        }).registerAction(['selection_mark', 'selection_search', 'selection_copy', 'selection_read'], (dom, action) => {
            let { text, start, end, key } = self.selection
            switch (action[0]) {
                case 'selection_read':
                    g_speaker.read(text, {
                        start,
                        end,
                        key,
                    })
                    break
                case 'selection_mark':
                     g_mark.toggle(text, {
                        start,
                        end,
                        text,
                        key,
                    })
                     break
                case 'selection_copy':
                    ipc_send('copy', text)
                    break

                case 'selection_search':
                    return g_dict.search(text)
            }
            g_dropdown.hide('selection')
        })


        let timeout = 0
        $(document).on('selectionchange', e => {
            lastSelectedTime = new Date().getTime()
            self.selectedText = self.getSelectText();
            clearTimeout(timeout);
            timeout = setTimeout(() => self.onSelectedText('select'), 200)
        })



    },

    scrollTo(h) {
        let div = $('#text_content')[0]
        if (h == 'top') {
            h = 0
        } else
        if (h == 'bottom') {
            h = div.scrollHeight
        }
        div.scrollTop = h
    },

    getItem(chapter) {
        return getEle({ chapter }, '.content_chapter')
    },


    onSelectedText(type) {
        let text = this.selectedText
        if (text.length) {
            // g_speaker.speak(text);
            if (type == 'selected') {
                g_dropdown.quickShow('selection')
            }
        }
    },

    index: 0,
    setContent(item, method = 'append') {
        const insert = html => $('#text_content')[method](html)
        if (typeof(item) == 'string') return insert(item)

        let { site, id, page } = item
        let { chapter_name, body, section_name, character_count, page_id } = item

        html = formatText(body).replaceAll('\n\n', '\n').split('').map((word, i) => {
            return `<span class="word" data-index="${i}">${word == '\n' ? '</br>' : word}</span>`
        }).join('')

        let key = [site, id, page].join('||')
        insert(`
            <div class="content_chapter m-2" data-chapter="${key}">
                <div class="d-flex w-full border-top sticky-top bg-auto" style="z-index: 1">
                    <div class="flex-grow-1"><b class="fs-1">${chapter_name}</b></div>
                    <div>${page}/${g_library.current.pages}</div>
                </div>
                ${chapter_name ? `` : ''}
                ${html}
            </div>
        `)
        g_ui.show('content')
        g_mark.loadMarks(key)
    },

    clear() {
        $('#text_content').html('')
    },

    getSelectText() {
        if (window.getSelection) {
            let { baseNode, extentNode } = window.getSelection()
            if (baseNode && extentNode) {
                let key = getParentAttr(baseNode, 'data-chapter')
                if (key == getParentAttr(extentNode, 'data-chapter')) {
                    let start = parseInt(getParentAttr(baseNode, 'data-index'))
                    let end = parseInt(getParentAttr(extentNode, 'data-index'))
                    let doms = this.getRangeDoms(key, start, end)
                    let text = doms.map(el => el.outerText).join('')
                    this.selection = { start, end, doms, text, key }
                    return text
                } else {
                    // 跨页不给选中
                      window.getSelection().removeAllRanges()
                }
            }
        }
        return '';
    },

    getRangeDoms(key, start, end) {
        let doms = [];
        if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                doms.push(this.getWord(key, i)[0])
            }
        }
        return doms
    },

    getWord(key, index) {
        return this.getItem(key).getEle({ index })
    },

}

function formatText(text) {
    return text.replaceAll('</br>', "\n").replaceAll('<br />', "\n").replaceAll('<p>', '').replaceAll('</p>', "\n");
}



g_content.init()