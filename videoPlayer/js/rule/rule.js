let g_rule = {
    rule_default: function(i, url) {
        switch (i) {
            case 1:
                return {
                    url: url,
                    information: {
                        title: `$('.stui-content__detail .title').html()`,
                        desc: `$('.stui-content__detail .detail-content').html()`,
                        cover: `document.querySelector('.pic img').dataset.original`,
                        list: `
                            (() => {
                                let r = {};
                                let i = 0;
                                for(let playlist of document.querySelectorAll('.stui-content__playlist')){
                                    i++;
                                    for(let item of playlist.querySelectorAll('a')){
                                        if(!r['播放列表'+i]) r['播放列表'+i] = {};
                                        r['播放列表'+i][item.outerText] = item.href;
                                    }
                                }
                                return r;
                            })();
                        `,
                    }
                }

            case 2:
                return {
                    url: url,
                    information: {
                        title: `$('.module-info-heading h1').text()`,
                        desc: `$('.module-info-introduction-content p').text()`,
                        cover: `document.querySelector('.module-item-pic img').src`,
                        list: `
                            (() => {
                                let r = {};
                                $('.module-tab-item.tab-item').each((i, tab) => {
                                    r[tab.dataset.dropdownValue] = {};
                                });

                                $('.module-play-list-content').each((i, tab) => {
                                  for(let a of tab.children) r[Object.keys(r)[i]][a.outerText] = a.href;
                                });
                                return r;
                            })();
                        `,
                    }
                }

            case 3:
                return {
                    url: url,
                    information: {
                        title: `$('.hl-dc-title').text()`,
                        desc: `$('.blurb').text()`,
                        cover: `document.querySelector('.pic img').dataset.original`,
                        list: `
                            (() => {
                                let r = {};
                                $('.hl-tabs a').each((i, tab) => {
                                    r[tab.outerText.trim()] = {};
                                });

                                $('.hl-plays-list').each((i, list) => {
                                  for(let a of list.querySelectorAll('a')) r[Object.keys(r)[i]][a.outerText] = a.href;
                                });
                                return r;
                            })();
                        `,
                    }
                }

            case 4:
                return {
                    url: url,
                    information: {
                        title: `$('.page-title').text()`,
                        desc: `$('.video-info-content span').text()`,
                        cover: `$('.module-info-poster img').src`,
                        list: `
                            (() => {
                                let r = {'播放地址': {}};
                                $('.module .scroll-content a').each((i, a) => r['播放地址'][a.outerText] = a.href);
                                return r;
                            })();
                        `,
                    }
                }

            case 5:
                return {
                    url: url,
                    information: {
                        title: `$('.page-title').text()`,
                        desc: `$('.vod_content').text()`,
                        cover: `document.querySelector('.module-item-cover img').dataset.src`,
                        list: `
                            (() => {
                                let r = {};
                                $('.module-tab-item.tab-item').each((i, tab) => {
                                    r[tab.dataset.dropdownValue] = {};
                                });

                                $('.module-player-list .scroll-content').each((i, tab) => {
                                  for(let a of tab.children) r[Object.keys(r)[i]][a.outerText] = a.href;
                                });
                                return r;
                            })();
                        `,
                    }
                }

            case 6:
                return {
                    url: url,
                    information: {
                        title: `document.querySelector('.stui-content__detail .title').outerText`,
                        desc: `document.querySelector('.detail-content').outerText`,
                        cover: `document.querySelector('.pic img').dataset.original`,
                        list: `
                        (() => {
                            let r = {'播放列表1': {}};
                            for(let a of document.querySelectorAll('.stui-content__playlist a')){
                               r['播放列表1'][a.outerText] = a.href;
                            }
                            return r;
                        })();
                    `,
                    }
                }

            case 7:
                return {
                    url: url,
                    information: {
                        title: `$('.myui-content__detail .title').text()`,
                        desc: `$('.sketch.content').text()`,
                        cover: `$('.picture img')[0].src`,
                        list: `
                            (() => {
                                let r = {};
                                $('.nav-tabs:eq(0) li').each((i, tab) => {
                                    r[tab.outerText] = {};
                                });

                                $('.myui-content__list').each((i, list) => {
                                  for(let a of list.querySelectorAll('a')) r[Object.keys(r)[i]][a.outerText] = a.href;
                                });
                                return r;
                            })();
                        `,
                    }
                }
        }
    },
    list: {},

    m3u8: [
        'https://cdn.zoubuting.com/20210721/vE7VLJ1r/hls/index.m3u8',
        'https://cdn.zoubuting.com/20210721/vE7VLJ1r/hls/index.m3u8',
        'https://cloud.renrenmi.cc:2323/jiemi?key=BDVVNgM2BmYGNltyURACSlEWAUVSF1UTABg=&sign=1deba959589db90fa8483a8cea56e51a&t=1654264996&ts=1622624594&name=132b07fc8121602b4bd6eda8a90dc814.m3u8'
    ],

    search(keyword) {
        for (let [name, item] of Object.entries(this.rule)) {
            if (item.search) {

            }
        }
    },

    init: function() {
        const self = this
        let rule = {

            看了么: {
                url: 'https://www.ksksl.com/voddetail/(.*?).htm',
                information: {
                    title: `document.querySelector('h1').outerText`,
                    desc: `document.querySelector('.details-content-default').outerText`,
                    list: `
                        (() => {
                            let r = {};
                            $('.list-box.marg').each((i, list) => {
                                let n = list.querySelector('h2').outerText
                                r[n] = {}
                              for(let a of list.querySelectorAll('.play_li a')) r[n][a.outerText] = a.href;
                            });
                            return r;
                        })();
                    `,
                }
            },

            影视大全: {
                url: 'https://www.jinshier66.com/album/(.*?).htm',
                information: {
                    title: `document.querySelector('h2').outerText`,
                    desc: `document.querySelector('.details-content-default').outerText`,
                    search: `$('#wd').val(%keyword%);$('.btn-search').click()`,
                    list: `
                        (() => {
                            let r = {};
                            $('#playTab a.gico').each((i, tab) => {
                                r[tab.outerText] = {};
                            });

                            $('.playlist ul').each((i, list) => {
                              for(let a of list.querySelectorAll('a')) r[Object.keys(r)[i]][a.outerText] = a.href;
                            });
                            return r;
                        })();
                    `,
                }
            },
            嘀哩嘀哩: {
                url: 'https://www.bdys01.com/guoju/mp4/(.*?).htm',
                information: {
                    title: `document.querySelector('h2').outerText`,
                    desc: ``,
                    list: `
                        (() => {
                            let r = {'播放列表1': {}};
                            for(let a of document.querySelectorAll('#play-list a')){
                               r['播放列表1'][a.outerText] = a.href;
                            }
                            return r;
                        })();
                    `,
                }
            },
            高清mp4: {
                url: 'https://www.mp4pa.com/mp4/(.*?).html',
                information: {
                    title: `document.querySelector('.title').outerText`,
                    desc: `document.querySelector('.desc').outerText`,
                    list: `
                        (() => {
                            let r = {};
                            $('#NumTab a').each((i, tab) => {
                                r[tab.outerText] = {};
                            });

                            $('.play_list_box').each((i, list) => {
                              for(let a of list.querySelectorAll('a')) r[Object.keys(r)[i]][a.outerText] = a.href;
                            });
                            return r;
                        })();
                    `,
                }
            },

            橘子影院: {
                url: 'http://kcsybk.cn/index.php/vod/detail/id/(.*?).html',
                information: {
                    title: `document.querySelector('.fyy').outerText`,
                    desc: `document.querySelector('#cText').outerText`,
                    list: `
                        (() => {
                            let r = {};
                            $('.channelname').each((i, tab) => {
                                r[tab.outerText] = {};
                            });

                            $('.play_list_box').each((i, list) => {
                              for(let a of list.querySelectorAll('a')) r[Object.keys(r)[i]][a.outerText] = a.href;
                            });
                            return r;
                        })();
                    `,
                }
            },

            厂长资源: {
                url: 'https://www.czspp.com/movie/(.*?).html',
                information: {
                    title: `document.querySelector('.moviedteail_tt h1').outerText`,
                    desc: `document.querySelector('.yp_context p').outerText`,
                    list: `
                        (() => {
                            let r = {'播放列表1': {}};
                            for(let a of document.querySelectorAll('.paly_list_btn a')){
                               r['播放列表1'][a.outerText] = a.href;
                            }
                            return r;
                        })();
                    `,
                }
            },
            干饭影视: {
                url: 'http://www.gfysys.com/voddetail/(.*?).html',
                information: {
                    title: `document.querySelector('.title.wdetail').outerText`,
                    desc: `document.querySelector('.detail-sketch').outerText`,
                    list: `
                         (() => {
                                let r = {};
                                for(let playlist of document.querySelectorAll('.channelname')){
                                    let r1 = {};
                                    for(let item of playlist.querySelectorAll()){
                                        r1[item.outerText] = item.href;
                                    }
                                    r[playlist.outerText] = r1;
                                }
                                return r;
                            })();
                    `,
                }
            },
            小强迷: {
                url: ['https://www.xqmi.top/index.php/vod/detail/id/(.*?).html', 'https://www.xqmi.top/index.php/vod/play/id/(.*?)/sid/(.*?)/nid/(.*?).html'],
                url_replace: `(() => {
                        let id = cutString({url}, '/id/', '.html');
                        if(id != ''){
                            return 'https://www.xqmi.top/index.php/vod/play/id/'+id+'/sid/1/nid/1.html'
                        }
                        return {url}
                    })();
                    `,
                information: {
                    title: `$('.video-title h2').text()`,
                    desc: `$('.stui-content__desc').text()`,
                    list: `
                            (() => {
                                let r = {};
                                let i = 0;
                                for(let playlist of $('.stui-content__playlist')){
                                    i++;
                                    for(let item of $(playlist).find('a')){
                                        if(!r['播放列表'+i]) r['播放列表'+i] = {};
                                        r['播放列表'+i][item.outerText] = item.href;
                                    }
                                }
                                return r;
                            })();
                        `,
                }
            },
            哗嘀影视: {
                url: 'https://www.btbdys.com/aiqing/(.*?).html',
                information: {
                    title: `$('h1.d-none.d-md-block').text()`,
                    desc: `$('p.d-none.d-md-block.mb-0').text()`,
                    list: `
                            (() => {
                                let r = {};
                                for(let item of $('.btn.btn-square.me-2')){
                                    r['播放列表'][item.outerText] = item.href;
                                }
                                return r;
                            })();
                        `,
                }
            },
            影视之家: this.rule_default(1, 'https://www.wybg666.com/(.*?).html'),
            皮皮泡: this.rule_default(1, 'https://www.pipipao.com/vod/(.*?).html'),
            达达龟: this.rule_default(1, 'http://www.dadagui.com/voddetail/(.*?).html'),
            libvio: this.rule_default(1, 'https://www.libvio.me/detail/(.*?).html'),
            神马影院: this.rule_default(1, 'https://www.smdyy.cc/kan/(.*?).html'),
            双十电影: this.rule_default(1, 'https://www.1010dy.vip/detail/(.*?)/'),
            影院之家: this.rule_default(1, 'https://www.txxlcdc.cn/voddetail/(.*?).html'),
            va影视: this.rule_default(1, 'https://www.vays.cn/index.php/vod/detail/id/(.*?).html'),

            瓜皮TV: this.rule_default(2, 'https://guapitv.xyz/vod/(.*?).html'),
            蓝光影院: this.rule_default(2, 'https://www.lgyy.cc/voddetail/(.*?).html'),
            奇粹视频: this.rule_default(2, 'http://www.blssv.com/index.php/vod/detail/id/(.*?).html'),
            莫扎兔: this.rule_default(2, 'http://www.dazhutizi.net/index.php/vod/detail/id/(.*?).html'),
            快猫影视: this.rule_default(2, 'https://www.maomiava.com/index.php/vod/detail/id/(.*?).html'),
            voflix: this.rule_default(2, 'https://www.voflix.com/detail/(.*?).html'),
            nikeTV: this.rule_default(2, 'https://www.ajeee.com/detail/(.*?).html'),
            freeok: this.rule_default(2, 'https://www.freeok.vip/voddetail/(.*?).html'),
            小宝影视: this.rule_default(2, 'https://www.1iuxb.com/voddetail/(.*?).html'),

            '87影院': this.rule_default(3, 'https://87dyba.com/voddetail/(.*?).html'),
            '85看': this.rule_default(3, 'https://www.85kankan.com/index.php/vod/detail/id/(.*?).html'),

            麻花影视: this.rule_default(4, 'https://www.mhyyy.com/detail/(.*?).html'),
            牛马TV: this.rule_default(4, 'https://www.niumatv.cc/vod/(.*?).html'),
            爱看影院: this.rule_default(4, 'https://www.ikyy.cc/detail/(.*?).html'),
             um影院: this.rule_default(4, 'https://www.umkan.com/index.php/vod/detail/id/(.*?).html'),
            视中心影视: this.rule_default(4, 'https://www.ksksi.com/voddetail/(.*?).html'),
            星辰影院: this.rule_default(4, 'https://www.xcyingy.com/vod/(.*?).html'),
             锐行加速: this.rule_default(4, 'https://www.cjtyy.top/index.php/vod/detail/id/(.*?).html'),
            小熊影视: this.rule_default(4, 'https://www.xxys520.com/voddetail/(.*?).html'),
            稀饭影视: this.rule_default(4, 'https://www.xifanys.com/yingpiandetail/(.*?).html'),
            '6080': this.rule_default(4, 'https://www.dy6080.vip/video/(.*?).html'),

            我爱跟剧: this.rule_default(5, 'https://www.genmov.com/video/(.*?).html'),

            饭团影院: this.rule_default(6, 'https://www.fantuanhd.com/detail/(.*?).html'),
            ab影院: this.rule_default(6, 'https://abu22.com/voddetail/(.*?).html'),
            
            '31看影视': this.rule_default(7, 'http://www.31kan.vip/31kan/(.*?).html'),
            '333影视': this.rule_default(7, 'https://www.ylwt33.com/voddetail/(.*?).html'),
           
        }
        self.list = rule;

        // 网络监听
        nodejs.session.fromPartition('persist:webview').webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
            let {url, webContents} = details;
            let cancel = false
            if (url.indexOf('.m3u8') != -1) {
                // 替换和过滤一些播放器(GET参数带了URL播放地址)
                ['https://www.tutukiki.com/m3u8/?url=', 'http://www.tutukiki.com/m3u8/?url='].forEach(replace => url = url.replace(replace, ''))
                self.browser_callback({webContents, url, type: 'url'})
                cancel = true // 有些m3u8只能访问一次？？
            } else
            if (details.resourceType == 'media') {
                self.browser_callback({webContents, url, type: 'media'})
            }
            callback({ cancel });
        })
        // this.playlist_parse('https://www.fantuanhd.com/detail/id-1404.html')
        // this.url_parse('https://www.fantuanhd.com/play/id-1404-4-18.html', url => {
        //     g_videoTabs.tab_new({
        //         value: url,
        //         title: '测试',
        //     })
        // })

        // doAction('cp_loadURL,https://www.fantuanhd.com/detail/id-1404.html')
    },

    browser_callback(opts){
        // if(!opts.web) opts.web = 
        let win = getBrowserWindowFromWebContents(opts.webContents);
        let wid = opts.webContents.id
        if (win) win.close();

        let type = opts.type
        if(this.ids[wid]){
            let {events} = this.ids[wid]
            delete this.ids[wid]
            if(events[type]){
                for(let callback of events[type]){
                    if(callback(opts) === false) return
                }
            }
        }
    },

    browser_on(wid, eventName, callback){
        if(this.ids[wid]){
            if(!this.ids[wid].events[eventName]) this.ids[wid].events[eventName] = []
            this.ids[wid].events[eventName].push(callback)
        }
    },

    rule_get: function(id) {
        return this.list[id];
    },

    entries(callback) {
        for (let [k, v] of Object.entries(this.list)) {
            if (callback(k, v) === false) return
        }
    },

    // 提取页面信息
    detail_fetch: async function(web) {
        let url = web.getURL()
        let ret = {url}
        let name = this.url_match(url);
        let r = this.rule_get(name);
        console.log(name, r);
        if (r) {
            for (let kn in r.information) {
                let res = await web.executeJavaScript(r.information[kn]);
                ret[kn] = res;
            }
        }
        let win = getBrowserWindowFromWebContents(web);
        if (win) win.close();
        return ret;
    },

    // 匹配播放列表地址
    url_match: function(url, retName = true) {
       for(let [k, v] of Object.entries(this.list)){
            for (let reg of [].concat(v.url)) {
                if (new RegExp(reg).test(url)) {
                    if (!retName) {
                        if (v.url_replace) {
                            url = eval(d.url_replace.replaceAll('{url}', `"${url}"`));
                        }
                        return url;
                    }
                    return k;
                }
            }
        }
    },

    ids: {},
    playlist_parse(url, callback) {
       let win = this.browser_build(url)
       win.webContents.on('did-finish-load', e => {
            this.detail_fetch(e.sender).then(callback)
       });
    },

    url_parse(url, callback){
        let win = this.browser_build(url)
        this.browser_on(win.webContents.id, 'url', ({url}) => callback(url))
    },

    browser_close(url){
        for(let [id, d] of Object.entries(this.ids)){
            if(isEmpty(url) || d.url == url){
                !d.win.isDestroyed() && d.win.close()
                delete this.ids[id]
            }
        }
    },

    browser_build(url){
        this.browser_close(url)

        let path = nodejs.dir + '\\js\\rule\\'
        let debug = true
        let win = new nodejs.remote.BrowserWindow({
            show: debug,
            fullScreen: true,
            webPreferences: {
                // preload: path + 'preload.js',
                images: debug,
                offscreen: !debug,
                partition: "persist:webview",
            }
        })
        // win.openDevTools()
        win.loadURL(url)
        // win.show();

        this.ids[win.webContents.id] = {
            events: {},
            win,
            url,
        }

        win.webContents.setAudioMuted(true);
        
        // win.webContents.on('ipc-message', function(event) {
        //     console.log(event);
        //     let d = event.args;
        //     let webview = event.target;
        //     switch (event.channel) {
        //         case 'close':
        //             break;
        //     }
        // });
        return win
    }
}

g_rule.init();