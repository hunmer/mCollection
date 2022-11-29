var g_tabs = {
    // 一个组对应多个tabs
    init: function() {
        const self = this
        self.data = {
            // 片吧: {
            //     tab1: {
            //         url: 'https://www.baidu.com',
            //         title: '百度',
            //     },
            //     tab2: {
            //         url: 'https://www.google.com',
            //         title: '谷歌',
            //     },
            //      tab3: {
            //         url: 'https://www.google.com',
            //         title: '谷歌',
            //     },
            // },
            // 茶杯狐: {
            //     tab1: {
            //         url: 'https://www.baidu.com',
            //         title: '百度',
            //     },
            // },
        }

        g_action.registerAction(['rmcopy', 'rmdownload', 'rmsearch', 'rmopen'], (dom, action) => {
            g_modal.remove('rm')
            switch (action[0]) {
                case 'rmopen':
                    return ipc_send('url', self.rm[action[1]])
                case 'rmcopy':
                    return ipc_send('copy', self.rm[action[1]])
                case 'rmsearch':
                    return ipc_send('url', 'https://www.baidu.com/#ie=UTF-8&wd=' + self.rm[action[1]])
                case 'rmdownload':
                    let url = self.rm['srcURL']
                    let ext = popString(url, '.').toLowerCase()
                    if (!['mp4', 'jpg', 'png', 'ts'].includes(ext)) {
                        let type = self.rm['mediaType']
                        if (type == 'video') {
                            ext = 'mp4'
                        } else
                        if (type == 'image') {
                            ext = 'jpg'
                        } else {
                            ext = ''
                        }
                    }
                    return g_downloader.item_add('', {
                        url: url,
                        fileName: new Date().getTime() + '.' + ext
                    })
            }
        })
        g_action.registerAction('tab_show', dom => {
            let id = dom.dataset.tab
            let con = self.tab_getContent(id)
            let web = con.find('webview')

            if (web.attr('src') == undefined) {
                // 初始化URL
                web.attr('src', web.data('src'))
            } else {
                // 刷新状态
                self.web_update(web[0])
            }
            // web[0].send('focus') // 报错：未加载完毕
            self.lastWebview = web[0]
            con.addClass('active').siblings('.active').removeClass('active')

            g_plugin.callEvent('tabShow', {id, con, web})
        }).
        registerAction('keyup_url', (dom, action, e) => {
            let btn = $(dom).next().find('a')[1]
            btn.classList.toggle('disabled', dom.value == '')
            if (e.keyCode == 13) {
                btn.click()
            }
        }).
        registerAction('prevSite', dom => {
            g_tabs.btn_getCurrent().prev().click()
        }).
        registerAction('nextSite', dom => {
            g_tabs.btn_getCurrent().next().click()
        })

        g_menu.registerMenu({
            name: 'tab_menu',
            selector: '.nav-item[data-tab]',
            dataKey: 'data-tab',
            html: g_menu.buildItems([{
                    icon: 'world',
                    text: '浏览器打开',
                    action: 'tab_openURL'
                }, {
                    icon: 'clipboard',
                    text: '复制链接',
                    action: 'tab_copyURL'
                }, {
                    icon: 'share',
                    text: '分享',
                    action: 'tab_share'
                },
                {
                    icon: 'x',
                    text: '关闭其他',
                    action: 'tab_closeOther'
                }
            ])
        })

        g_action.registerAction(['tab_openURL', 'tab_favorite', 'tab_closeOther', 'tab_share', 'tab_copyURL', 'tab_information'], (dom, action, e) => {
            let id = g_menu.key
            let [site, uid] = id.split('-')
            let web = self.tab_getWeb(id)[0]
            g_menu.hideMenu('tab_menu')
            switch (action[0]) {
                case 'tab_information':
                    return;
                case 'tab_copyURL':
                    return ipc_send('copy', web.src)
                case 'tab_share':
                    loadRes([{ url: 'js/qrcode.min.js', type: 'js' }], () => {
                        alert(`
                        <div class="text-center">
                            <div id="qrcode" class="mx-auto" style="width: 256px; height: 256px;" ></div>
                        </div>
                            `, {
                            static: false,
                            title: '二维码分享',
                            onShow: () => {
                                new QRCode("qrcode", {
                                    text: web.src,
                                    width: 256,
                                    height: 256,
                                    colorDark: "#000000",
                                    colorLight: "#ffffff",
                                    correctLevel: QRCode.CorrectLevel.H
                                });
                            }
                        })
                    });
                    return;
                case 'tab_openURL':
                    return ipc_send('url', web.src)

                case 'tab_closeOther':
                    for (let btn of self.group_getTabs(site)) {
                        let s = btn.dataset.tab
                        if (s != id) self.tab_remove(s)
                    }
                    return
            }
        })

        g_action.registerAction(['web_forward', 'web_back', 'web_refresh', 'web_newTab', 'web_go', 'tab_closeTab', 'group_clear'], (dom, action, e) => {
            let par = $(dom).parents('[data-site]')
            let site = par.data('site')

            const getEle = ele => self.group_getEle(site, ele)
            const getWeb = () => self.group_getCurrentWeb(site)[0]

            switch (action[0]) {
                case 'group_clear':
                    return self.group_clear(site)
                case 'tab_closeTab':
                    return clearEventBubble(e) & self.tab_remove(getWeb().id)
                case 'web_go':
                    let u = getEle('url').url.val()
                    if (!isEmpty(u)) {
                        if (u.indexOf('//') == -1) {
                            u = 'https://' + u
                        }
                        getWeb().src = u
                    }
                    return
                case 'web_newTab':
                    return self.tab_add(site, {
                        url: getEle('url').url.val() || 'https://www.baidu.com'
                    })
                case 'web_forward':
                    return getWeb().goForward()
                case 'web_back':
                    return getWeb().goBack()
                case 'web_refresh':
                    return getWeb().reload()
            }
        })


        $(`<style>
            .tab_icon {
                width: 20px;
            }
        </style>`).appendTo('body')

    },

    data_set: function(data, reload) {
        this.data = data
        reload && this.reload()
    },

    // 关闭最后一个激活的webview(网页加载后没点击不会聚焦，所以不会触发webview的快捷键)
    tab_closeCurrent: function() {
        console.log('tab_closeCurrent', this.lastWebview)
        if (this.lastWebview) {
            g_tabs.tab_remove(this.lastWebview.id)
        }
    },

    // 更新
    reload: function() {
        for (let group in this.data) {
            this.group_getHtml(group)
        }
    },

    get_html: function(k, o) {
        const format = (s, o) => {
            for (let [k, v] of Object.entries(o)) {
                s = s.replace('%' + k + '%', v)
            }
            return s
        }
        switch (k) {
            case 'group-item':
                return format(`
                    <li class="nav-item text-nowarp" data-action="tab_show" data-tab="%id%">
                        <a class="nav-link %show%" data-bs-toggle="tab" >
                            <img class="tab_icon me-2" src="res/loading_sm.gif"></img>
                            <span>%title%</span>
                            <i class="ti ti-x ms-2" data-action="tab_closeTab"></i>
                        </a>
                    </li>
                `, o)

            case 'group-content':
                //  plugins partition="persist:test" 
                return format(`
                    <div class="tab-pane %show%" id="%tid%">
                        <div class="web w-full" style="height: 100vh">
                            <webview %show1%src="%url%" class="w-full h-full" contextIsolation="false" allowpopups disablewebsecurity nodeintegration spellcheck="false" preload="%preload%" id=%id%></webview>
                        </div>

                     </div>
                `, o)
        }
    },

    group_getHtml: function(group) {
        let items = this.group_get(group)
        if (!items) return ''

        let i = 0
        let h = ''
        let c = ''
        // 
        for (let [k, v] of Object.entries(items)) {
            let id = group + '-' + k
            let tid = 'tabs-' + id
            let show = i === 0
            h += this.get_html('group-item', { tid: tid, show: show ? 'active' : '', title: v.title, id: id })
            c += this.get_html('group-content', { tid: tid, show: show ? 'active' : '', url: v.url, show1: show ? '' : 'data-', preload: 'file://' + __dirname + '/js/webview.js', id: id })
            i++
        }
        return h ? `<div class="card">
                  <ul class="nav nav-tabs ${i <= 1 ? 'hide' : ''}" data-bs-toggle="tabs">
                    ${h}
                    <li class="nav-item ms-auto d-flex">

                        
                          <a class="nav-link dropdown-toggle" title="设置" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                            <i class="ti ti-settings fs-2"></i>
                          </a>

                          <div class="dropdown-menu dropdown-menu-demo">
                              <span class="dropdown-header">菜单</span>
                              <a class="dropdown-item" data-action="group_clear">
                                <i class="ti ti-x mr-2"></i>关闭所有
                              </a>
                          </div>

                    </li>
                  </ul>
                  <div class="card-body p-0">
                    <div class="tab-content">
                        ${c}
                         <div class="tab-pane" id="${group}-default">
                            默认展示
                         </div>
                    </div>
                  </div>
                </div>` : ''
    },

    // groups: [],
    // 初始化组
    group_init: function(group) {

    },
    group_clear: function(group) {
        let div = this.group_getContent(group)
        div.find('.nav-item').remove()
        div.find('.tab-pane').remove()
        div.find('[data-keyup="keyup_url"]').val('')
    },

    // 绑定元素
    group_bind: function(div) {
        div = $(div)
        // this.groups.push(div)
        let group = div.data('group')
        div.html(this.group_getHtml(group))
            .find('webview').each((i, webview) => this.webview_bind(webview))
    },
    ids: {}, // webContentID 对应 站点
    ids_remove: function(id) {
        g_network.remove(id) // 移除网络捕捉记录
        delete this.ids[id]
    },

    ids_get: function(id) {
        return this.ids[id]
    },
    ids_getWebview: function(id) {
        return $('webview[data-web-content="' + id + '"]')
    },
    // session: {},
    // exts: {
    //     'persist:test': {
    //         cjpalhdlnbpafiamejdnhcphjbkeiagm: true
    //     }
    // },
    // session_init(webContent) {
    //     let {partition, session} = webContent
    //     if(!this.session[partition]){
    //         // 初始化session
    //         // 如果session没有加载过扩展，则进行第一次加载
    //          session.on('extension-loaded', function(event, ext) {
    //             console.log('[' + ext.name + '] loaded!')
    //         })
    //         // 加载所有扩展
    //         for(let [ext, enable] of Object.entries(this.exts[partition] || {})){
    //             enable && session.loadExtension(__dirname + '/extensions/' + ext)
    //         }
    //         this.session[partition] = true
    //     }

    //     // 执行扩展脚本文件
    //     for(let ext of session.getAllExtensions()){
    //         for(let content of ext.manifest.content_scripts){
    //             // content.matches
    //             for(let url of content.js){
    //                 // webContent.executeJavaScriptInIsolatedWorld(0, [{url: __dirname + '/extensions/' + ext +  url}])
    //                 let js = (__dirname + '/extensions/' + ext.id +  url).replaceAll('\/', '/')
    //                 webContent.executeJavaScript(nodejs.files.read(js))
    //             }
    //             // webContent.send('loadJS', [__dirname + '/extensions/', content.js])
    //         }
    //     }
    // },
    webview_bind: function(webview) {
        let self = this
        webview.addEventListener('dom-ready', function(e) {
            this.setAudioMuted(getConfig('mute'))
            // 绑定webContentID
            let site = webview.id.split('-')[0]
            let wid = this.getWebContentsId()
            webview.dataset.webContent = wid
            self.ids[wid] = site

            // // 取session
            // let webContent = nodejs.webContents.fromId(wid)
            // webContent.partition = this.partition
            // self.session_init(webContent)

            // 自动聚焦webview 不用点击一次
            // https://github.com/electron/electron/issues/1773
            if (!isInputFocused()) {
                this.focus();
                window.blur();
                window.focus();
            }
        })

        webview.addEventListener('ipc-message', event => {
            var d = event.args; // 数组
            var web = event.target;
            // console.log(event)
            switch (event.channel) {
                case 'markURL':
                    return g_downloader.downloaded_toggle(g_cache.targetURL)
                case 'click':
                    // web点击时关闭dropdown
                    return bootstrap.Dropdown.clearMenus();
                case 'prevSite':
                case 'nextSite':
                    return g_action.do(null, event.channel);
                case 'log':
                    return console.log(d)
                case 'keydown':
                    return g_hotkey.onKeydown(d[0])
                case 'closeTab':
                    return self.tab_remove(web.id)
            }
        });

        const setIcon = (id, img) => {
            self.tab_getBtn(id).find('img').attr('src', img);
        }
        webview.addEventListener('update-target-url', function(e) {
            // 显示目标链接是否已经下载过
            g_cache.targetURL = e.url
            if (getConfig('downloadedHightlight')) {
                g_tabs.group_getContent(this.id.split('-')[0]).toggleClass('border-danger border-wide', g_downloader.downloaded_exists(e.url) >= 0)
            }
        });

        webview.addEventListener('page-title-updated', function(e) {
            self.tab_getBtn(this.id).find('span').html(e.title);
        });

        webview.addEventListener('context-menu', function(e) {
            let { params } = e
            self.rm = params

            let menu = []
            const add = (text, action = 'rmcopy', icon = 'clipboard') => {
                menu.push({
                    text: text,
                    icon: icon,
                    action: action
                })
            }
            add('浏览器打开本页', 'rmopen,pageURL', 'world')
            let type = params.mediaType == 'image' ? '图片' : '视频'
            if (params['altText']) add('提示文本', 'rmcopy,altText')
            if (params['linkText']) add('链接文本', 'rmcopy,linkText')
            if (params['linkURL']) add('链接', 'rmcopy,linkURL')
            if (params['pageURL']) add('当前页面', 'rmcopy,pageURL')
            if (params['srcURL']) {
                add(type + '链接', 'rmcopy,srcURL')
                add('浏览器打开链接', 'rmopen,srcURL', 'world')
                add('下载' + type, 'rmdownload,srcURL', 'download')
            }
            if (params['selectionText']) {
                add('复制选中', 'rmcopy,selectionText')
                add('搜索', 'rmsearch,selectionText', 'search')
            }
            if (menu.length) {
                g_plugin.callEvent('showWebMenu', {
                    webview: webview,
                    menu: menu,
                }).then(data => {
                    g_modal.modal_build({
                        title: '右键菜单',
                        id: 'rm',
                        static: false,
                        html: g_menu.buildItems(data.menu),
                        hotkey: true,
                    })
                })
            }
        });
        webview.addEventListener('destroyed', function(e) {
            self.ids_remove(this.getWebContentsId());
        });

        webview.addEventListener('page-favicon-updated', function(e) {
            setIcon(this.id, e.favicons[0]);
        });
        webview.addEventListener('page-title-updated', function(e) {
            self.tab_getBtn(this.id).find('span').html(e.title);
        });
        webview.addEventListener('did-start-navigation', function(e) {
            self.web_update(this)
        });
        webview.addEventListener('did-start-loading', function(e) {
            setIcon(this.id, 'res/loading_sm.gif');
        });

    },

    // 更新web的一些状态
    web_update: function(web) {
        const self = this;
        if (self.tab_isActived(web.id)) {
            let { forward, back, url, go } = this.group_getEle(web.id.split('-')[0], ['forward', 'back', 'url', 'go'])
            url.val(web.src)
            try {
                go.toggleClass('disabled', !web.src.length);
                web.canGoBack && back.toggleClass('disabled', !web.canGoBack());
                web.canGoForward && forward.toggleClass('disabled', !web.canGoForward());
            } catch (e) {
                // console.error(e)
            }
        }
    },

    tab_isActived: function(id) {
        return this.tab_getBtn(id).find('a.active').length
    },

    btn_getCurrent: function() {
        return $('[data-action="site_click"].active')
    },

    group_get: function(group) {
        return this.data[group]
    },

    // 添加组
    group_add: function() {

    },

    // 移除组
    group_remove: function() {

    },

    // 获取group下面的操作按钮
    group_getEle: function(group, list) {
        let div = this.group_getContent(group)
        if (!Array.isArray(list)) list = [list];
        let r = {}
        for (let n of list) {
            let s;
            switch (n) {
                case 'forward':
                case 'back':
                case 'go':
                    s = `[data-action="web_${n}"]`
                    break;

                case 'url':
                    s = 'input'
                    break;
            }
            r[n] = div.find(s)
        }
        return r
    },

    // 获取组div
    group_getContent: function(site) {
        return $(`.card[data-site="${site}"]`)
    },

    // 从webview新打开的窗口
    group_newTab: function(id, url) {
        let group = this.ids[id]
        if (!group) return;
        this.tab_add(group, {
            url: url
        })
    },

    // 添加tab
    tab_add: function(group, opts = {}) {
        let div = this.group_getContent(group)
        if (!div.length) return;

        opts = Object.assign({
            id: new Date().getTime(),
            title: 'new tab',
            url: 'https://www.baidu.com'
        }, opts)

        g_plugin.callEvent('beforeLoadURL', {
            opts: opts,
            group: group,
        }).then(data => {
            let { group, opts } = data
            let id = group + '-' + opts.id
            let tid = 'tabs-' + id

            let btn = $(this.get_html('group-item', { id, tid, show: '', title: opts.title })).insertBefore(div.find('.nav-item.ms-auto')) // 设置按钮之前
            let con = $(this.get_html('group-content', { tid, show: '', url: opts.url, show1: 'data-', preload: 'file://' + __dirname + '/js/webview.js', id: id })).appendTo(div.find('.tab-content'))

            let web = con.find('webview')[0]
            this.webview_bind(web)
            this.group_onTabChange(group)

            if (!g_hotkey.isActive('shiftKey')) {
                btn.find('a')[0].click() // 如果没有按住shift,则跳转到新窗口
            } else {
                // 预加载网页
                web.src = opts.url
            }
        })
    },

    // group 标签发生数量变化事件
    group_onTabChange: function(group) {
        let div = this.group_getContent(group)
        let btns = this.group_getTabs(group)
        div.find('.nav-tabs').toggleClass('hide', btns.length <= 1) // 一个标签以下则不显示标签列表
    },

    // 
    group_setActive: function(group, id) {},

    tab_setActive: function(id) {
        g_action.do(this.tab_getBtn(id)[0], 'tab_show')
    },

    getCurrentWeb() {
        return g_tabs.group_getCurrentWeb(g_tabs.btn_getCurrent().data('site'))
    },

    // 获取所有tabs
    group_getTabs: function(group) {
        return this.group_getContent(group).find('.nav-item:not(.ms-auto)')
    },

    // 获取组当前显示的webview
    group_getCurrentWeb: function(group) {
        return this.group_getContent(group).find('.tab-pane.active webview')
    },

    // 移除tab
    tab_remove: function(id) {
        g_plugin.callEvent('beforeTabRemove', {
            id: id,
            group: id.split('-')[0],
            btn: this.tab_getBtn(id),
            next: function() {
                let next = this.btn.next()
                if (next.hasClass('ms-auto')) next = this.btn.prev() // 设置按钮
                return next
            }
        }).then(data => {
            let { group, btn, next } = data
            btn.remove()

            let con = this.tab_getContent(id)
            let web = con.find('webview')[0]
            web.send('close') // 发给webview 返回webContentID 然后移除id

            if (web == this.lastWebview) {
                delete this.lastWebview
            }
            con.remove()
            if (next.length) {
                next.click()
                next.find('a').addClass('active') // bug:不知道为啥点击a没加active
            } else {
                // todo 显示默认标签页(最近的打开历史)
                $(`#${group}-default`).html('').addClass('show')
            }
            this.group_onTabChange(group)
        })
    },

    // 获取tab内容
    tab_getContent: function(id) {
        return $(`div.tab-pane#tabs-${id}`)
    },

    // 获取入口按钮
    tab_getBtn: function(id) {
        return $(`.nav-item[data-action="tab_show"][data-tab="${id}"]`)
    },

    // 获取webview
    tab_getWeb: function(id) {
        return $('#' + id)
    }

}

g_tabs.init()