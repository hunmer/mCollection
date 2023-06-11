// ==UserScript==
// @name    视频字幕
// @version    0.0.1
// @author    hunmer
// @description    为视频添加字幕支持
// @icon      text-caption:yellow
// @primary    99
// @updateURL   https://neysummer2000.fun/mCollection/scripts/视频字幕.js
// @namespace    78d028ac-23e5-45ad-9a2c-46313445d35a

// ==/UserScript==

({
    init() {
        const self = this

        g_plugin.registerEvent('db_connected', () => {
            this.subtitle_path = g_db.opts.path + '/subtitle/'
        })

        // 字幕样式
        g_setting.onSetConfig('subtitle_style', v => {
            g_style.getStyle('dplayer', '.dplayer-subtitle').cssText = v ?? ''
        }).apply('subtitle_style')

        // 字幕搜索
        let _searchIndex
        let _searchList = []
        const search_next = (add = 1) => {
            let index = _searchIndex + add
            if(index >= _searchList.length || index < 0) return
            _searchIndex = index
            getEle({action: 'subtitle_sub', start: _searchList[_searchIndex].startTime}).click()
        }

        g_action.registerAction({
            subtitle_style: () => {
                prompt(getConfig('subtitle_style', `font-size: 35px !important;\nbottom: 10% !important;\ncolor: rgb(183, 218, 255) !important;`)).then(style => setConfig('subtitle_style', style))
            },
            subtitle_sub: dom => g_preview.video.currentTime = dom.dataset.start,
            subtitle_onInput: dom => {
                g_pp.setTimeout('subtitle_onInput', () => {
                    let search = dom.value
                    if(search != ''){
                        _searchList = g_preview.subtitls.filter(({text}, i) => text.indexOf(search) != -1)
                        _searchIndex = -1
                        search_next()
                    }
                }, 500)
            },
            subtitle_onInputDown: (dom, action, ev) => {
                let offset = ({38: -1, 40: 1})[ev.keyCode]
                if(offset != undefined){
                    search_next(offset)
                    clearEventBubble(ev)
                }
            },
            subtitle_clearSearch: () => _searchIndex = -1,
        })

        // 设置字幕存储规则
        g_item.setItemType('subtitle', {
            initFile: args => args.subtitle = this.subtitle_path + args.data.md5 + '.vtt',
            getFile: args => args.subtitle,
            beforeCheck: () => { },
        })

        // 侧边字幕信息
        g_plugin.registerEvent('onBeforeShowingDetail', async ({ items, columns, type }) => {
            if (!columns.status || items.length != 1 || type != 'sqlite') return
            let subtitle = await g_item.item_getVal('subtitle', items[0])
            let content = nodejs.files.read(subtitle)
            if (content) {
                columns.status.list.subtitle = {
                    title: '字幕',
                    class: 'bg-green-lt',
                    props: `data-action="openFile" data-file="${subtitle}"`,
                    getVal: () => content.split(' --> ').length - 1 + '行'
                }
            }
        })

        // 播放器显示字幕
        g_plugin.registerEvent('beforePlayerInit', async ({ config, ev }) => {
            let url = await g_item.item_getVal('subtitle', ev.data)
            if (nodejs.files.exists(url)) {
                config.contextmenu.push({
                    text: '字幕样式',
                    click: () => doAction('subtitle_style')
                })
                config.subtitle = {url, type: 'webvtt'}
            }
        })

        // 字幕搜索
        g_search.tabs_register('subtitle', {
            tab: {
                icon: 'list-numbers',
                title: '字幕',
                html: g_search.replaceHTML(`%search_bar%<div class="search_result list-group list-group-flush p-2"></div>`)
            },
            onSearch(s) {
                return new Promise(reslove => {
                    g_pp.setTimeout('subtitle_search', async () => {
                        let ret = []
                        if (!isEmpty(s)) {
                            // TODO 指定MD5列表
                            let files = await nodejs.files.dirFiles(self.subtitle_path, ['vtt'])
                            files.forEach(file => {
                                let content = nodejs.files.read(file)
                                let start = content.indexOf(s)
                                if (start != -1) {
                                    let md5 = getFileName(file, false)
                                    ret.push({ md5, start })
                                }
                            })
                        }
                        reslove(ret)
                    }, 700) // 延迟搜索
                })
            },
            async onParse(item) {
                let data = await g_data.data_get(item.md5)
                return g_datalist.item_parse({ data, view: 'list' })
            }
        })

        // 字幕浏览器
        g_preview.tabs_inst.subtitle = {
            tab: {
                id: 'subtitle',
                icon: 'list-numbers',
                title: '字幕',
                html: `
                <div class="input-icon mb-3">
                    <input type="text" value="" class="form-control" placeholder="搜索字幕" data-input="subtitle_onInput" data-blur="subtitle_clearSearch" data-keydown="subtitle_onInputDown" />
                    <span class="input-icon-addon">
                        <i class="ti ti-search"></i>
                    </span>
                </div>
                <div class="overflow-y-auto h-full" id="subtitle_list">
                    
                </div>
            `
            },
            onShow() {
                let cues = g_preview?.video?.textTracks[0]?.cues
                if(cues){
                    let items = g_preview.subtitls = []
                    for(let i=0;i<cues.length;i++){
                        let {text, startTime, endTime} = cues[i]
                        items.push({
                            text, endTime, startTime,
                            row: [i+1, getTime(startTime), (endTime - startTime).toFixed(1), text],
                            props: `data-action="subtitle_sub" data-start="${startTime}" data-end="${endTime}"`
                        })
                    }

                    g_preview.tabs.getContent('subtitle').find('#subtitle_list').html(
                        g_tabler.build_table({
                            items,
                            headerClass: 'sticky-top',
                            headers: [{title: '*'}, {title: '时间'},  {title: '时长'}, {title: '文本'}],
                        })
                    )

                    clearInterval(self.timer)
                    let lastTime
                    self.timer = setInterval(() => {
                        // 更新字幕位置
                        let time =  g_preview.video.currentTime
                        let find = items.find(({startTime, endTime}) => time >= startTime && time <= endTime)
                        if(find && lastTime != time){
                            $('#subtitle_list .table-primary').removeClass('table-primary')
                            let el = getEle({action: 'subtitle_sub', start: find.startTime})
                            // TODO 全屏预览外的外挂显示
                            if(el.length){
                                el = el.get(0)
                                el.classList.add('table-primary')
                                el.scrollIntoViewIfNeeded()
                            }
                            lastTime = time
                        }
                    }, 500)
                }
            },
            onHide: () => {},
        }

        g_plugin.registerEvent('item_unFullPreview', () => clearInterval(self.timer))

        // 视频字幕标识


    },
    timer: 0,
}).init()

