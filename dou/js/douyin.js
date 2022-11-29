var g_douyin = {
    init() {
        let self = this;

        g_menu.registerMenu({
            name: 'user_item',
            selector: '__',
            dataKey: 'data-uid',
            html: g_menu.buildItems([{
                action: 'user_update',
                class: 'text-success',
                text: '更新',
                icon: 'refresh'
            }, {
                action: 'user_makeReaded',
                class: 'text-success',
                text: '全部已读',
                icon: 'tag'
            }, {
                action: 'user_delete',
                class: 'text-danger',
                text: '删除',
                icon: 'trash'
            }]),
            onShow: key => {

            }
        });

        g_action.registerAction({
            user_homepage(dom) {
                let uid = $(dom).parents('[data-uid]').data('uid');
                self.user_homepage(uid);
            },
            user_follow(dom) {
                dom = $(dom);
                let par = dom.parents('[data-uid]');
                let uid = par.data('uid');
                let d = {
                    user: {
                        icon: par.find('img').attr('src'),
                        name: par.find('b').text(),
                    }
                }
                if (dom.hasClass('am-btn-danger')) {
                    self.add(uid, d);
                    dom.text('取消关注').removeClass('am-btn-danger');
                } else {
                    self.remove(uid);
                    dom.text('关注').addClass('am-btn-danger');
                }
            },
            videos_readedAll() {
                showModal({
                    title: `确定一键已读所有视频吗?`,
                    msg: '一键已读',
                }).then(() => {
                    let now = new Date().getTime();
                    for (let uid in self.list) {
                        let d = self.list[uid];
                        for (let id in d.list) {
                            let item = d.list[id];
                            if (!item.last) item.last = now;
                        }
                    }
                    self.save();
                    domSelector('videos_readedAll').addClass('hide');
                });
            },
            user_public_remove() {
                showModal({
                    title: `确定清除服务器内的账号吗?`,
                    msg: '移除账号',
                }).then(() => {
                    dom = $(dom);
                    let par = dom.parents('[data-uid]');
                    let uid = par.data('uid');

                    let r = {
                        type: 'remove',
                        list: {}
                    }
                    r.list[uid] = {}

                    $.ajax({
                            url: g_api + 'douyin.php',
                            type: 'POST',
                            dataType: 'json',
                            data: { data: JSON.stringify(r) },
                        })
                        .done(function(data) {
                            par.remove();
                            toast('移除成功', 'success');
                        })
                        .fail(function() {
                            toast('移除失败', 'danger');
                        })
                })
            },
            account_load_list(dom) {
                $('#user_list').html('<h4 class="mt-10 text-center">加载中...</h4>')
                if (dom.value == 'public') {
                    $.getJSON(g_api + 'douyin.php', function(json, textStatus) {
                        if (textStatus == 'success') self.user_list(json, true);
                    });
                } else {
                    self.user_list(self.list);
                }
            },
            user_menu() {
                g_menu.showMenu('user_item', $(dom).parents('[data-uid]'))

            },
            account_resetViewed() {
                showModal({
                    title: `确定清除所有已看的吗?`,
                    msg: '清除已看',
                }).then(() => {
                    for (let k in self.list) {
                        let d = self.list[k];
                        d.list = {};
                        d.lastUpdateTime = 0;
                        d.lastVideo = 0;
                    }
                    self.save()
                    self.account_checkNew();
                })
            }
        })

        g_action.registerAction(['user_update', 'user_web', 'user_makeReaded', 'user_delete'], (dom, action) => {
            let uid = g_menu.key;
            switch (action[0]) {
                case 'user_web':
                    ipc_send('url', `https://www.douyin.com/user/` + uid)
                    break;

                case 'user_update':
                    self.account_checkNew(uid);
                    break;

                case 'user_makeReaded':
                    self.list[uid].list = {};
                    self.save();
                    break;

                case 'user_delete':
                    let d = self.list[uid];
                    showModal({
                            title: `确定删除用户 : ${d.user.name} 吗?`,
                            msg: '删除用户',
                        })
                        .then(() => {
                            self.remove(uid);
                        })
                    break;
            }
            g_menu.hideMenu('user_item');
        })


        g_action.registerAction(['user_updateAll', 'user_add', 'user_uploadAll'], (dom, action) => {
            $('#user_actions').modal('close');
            switch (action[0]) {
                case 'user_uploadAll':
                    let r = { type: 'add', list: {} };
                    for (let [id, d] of Object.entries(self.list)) {
                        r.list[id] = {
                            user: d.user,
                        }
                    }
                    $.ajax({
                            url: g_api + 'douyin.php',
                            type: 'POST',
                            dataType: 'json',
                            data: { data: JSON.stringify(r) },
                        })
                        .done(function(data) {
                            toast('上传成功', 'success');
                        })
                        .fail(function() {
                            toast('上传失败', 'danger');
                        })
                    break;
                case 'user_updateAll':
                    self.account_checkNew();
                    break;

                case 'user_add':
                    $('#user-actions').modal('close');
                    showModal({
                        type: 'prompt',
                        title: '添加检测账号',
                        textarea: getClipboardText(),
                    }).then(url => {
                        self.link_parse(url);
                    })
                    break;
            }
        });
        this.list = local_readJson('douyin', {
            'MS4wLjABAAAA0wudxop_wywKVRpwEMRZNqURMX-twXQK3LyBULMESYU': {
                lastUpdateTime: 0, // 最后检测更新时间
                lastVideo: 0, // 最后发布的视频ID
                list: {}, // 未看列表
                group: '', // 分组
                desc: '这是介绍',
                user: { // 用户信息
                    icon: 'https://p3-pc.douyinpic.com/origin/aweme-avatar/tos-cn-avt-0015_f137ea789a756260b24eb2742d023f48.jpeg',
                    name: 'test',
                }
            }
        });
        this.update();
        // this.user_homepage('MS4wLjABAAAAs-MlRqxff9efYytMFV4tJd1gIa5WDQHAAo2LWaAMPwQ')
    },

    // 展示用户主页
    user_homepage(uid) {
        toast('正在获取用户信息', 'primary');
        this.douyin_fetchUser(uid, d => {
            let exists = this.list[uid];
            $('#homepage').html(`
             <div class="am-g mt-10 text-center">
                <div class="am-u-sm-3 ">
                    <img class="am-circle mx-auto " title="${d.name}" src="${d.icon}" width="60" height="60"/>
                </div>
                <div class="am-u-sm-3">获赞<br>${numToStr(d.like)}</p></div>
                <div class="am-u-sm-3">关注<br>${numToStr(d.following)}</div>
                <div class="am-u-sm-3">粉丝<br>${numToStr(d.followers)}</div>
            </div>

             <b class="ml-2">${d.name}</b>
             <hr>
             <div>${d.desc.replaceAll('\n', '<br>')}</div>
             <div class="am-btn-group w-full mt-10">
              <button class="am-btn ${exists ? '' : 'am-btn-danger'}" style="width: 80%;">${exists ? '取消关注' : '关注'}</button>
              <div class="am-dropdown" data-am-dropdown>
                <button class="am-btn am-dropdown-toggle" data-am-dropdown-toggle> <span class="am-icon-caret-down"></span></button>
                <ul class="am-dropdown-content">
                  <li class="am-dropdown-header">更多选项</li>
                  <li><a href="#">打开主页</a></li>
                  <li class="am-divider"></li>
                  <li><a href="#">删除账号</a></li>
                </ul>
              </div>
            </div>
             <hr>
              <div class="am-form-group mt-10">
                  <span class="am-badge am-badge-danger mr-2">${d.videos}个作品</span>
                  <label class="am-checkbox-inline">
                    <input type="checkbox" value="option1"> 已观看
                  </label>
                  <label class="am-checkbox-inline">
                    <input type="checkbox" value="option2"> 热门
                  </label>
              </div>

              <div id="homepage_videos" class="am-g">
              <ul class="am-avg-sm-2 am-avg-md-4 am-avg-lg-6 am-thumbnails">
            </ul>
              </div>
        `).find('.am-dropdown').dropdown();
            // let nextPage = () => {
            //     this.user_loadVideos(g_cache.homepage);
            // }
            // $('#homepage')[0].onscroll = function(e) {
            //     let top = this.scrollTop;
            //     if (top + this.offsetHeight + 50 >= this.scrollHeight) {
            //         let now = new Date().getTime();
            //         if (now >= g_cache.homepage.last) {
            //             g_cache.homepage.last = now + 500;
            //             nextPage();
            //         }
            //     }
            // }
            // nextPage();

        })
    },

    video_getTime(item) {
        let u = url => typeof(url) == 'string' && url.split('_').at(-1);
        return parseInt([u(item.video.cover.uri), u(item.video.dynamic_cover.uri), u(item.video.origin_cover.uri)].find(t => {
            return !isNaN(parseInt(t));
        }) + '000')
    },

    user_loadVideos(opts) {
        let h = '';
        this.douyin_fetchVideos(opts, data => {
            let cursor = 999999999999999;
            for (let item of data.aweme_list) {
                let vid = item.aweme_id;
                let time = this.video_getTime(item);
                cursor = Math.min(time, cursor);

                let detail = g_douyin.getVideoDetail(item);
                g_cache.homepage_videos[vid] = detail
                h += `
                      <li data-vid="${vid}" class="position-relative" data-action="coll_play">
                      <span class="am-badge am-badge-primary position-absolute" style="top:0;left:5px;">${time_getRent(time)}</span>
                      <img style="width: 100%;" title="${detail.desc}" class="am-thumbnail lazyload" src="${detail.cover}"  />
                      <span class="text-danger am-badge am-round  position-absolute" style="left: 20px;bottom:20px;"><i class="am-header-icon am-icon-heart mr-2"></i>${numToStr(detail.like)}</span>
                    </li>
                `
                // item.video.play_addr.url_list[2]
            }
            g_cache.homepage.cursor = cursor;
            $('#homepage_videos ul').append(h).find('.lazyload').lazyload();

        });

    },

    link_parse(url) {
        this.douyin_parseUser(url, d => {
            this.add(d.sec_uid, {
                desc: d.desc,
                user: { // 用户信息
                    icon: d.icon,
                    name: d.name,
                }
            });
            toast('添加成功', 'success');
        })
    },

    user_list(list, public = false) {
        let exists = Object.keys(this.list);
        let h = '';
        for (let [id, d] of Object.entries(list)) {
            let e = exists.includes(id);
            h += `
              <li data-uid="${id}">
                 <img data-action="user_homepage" class="am-circle mx-auto mr-2" title="${d.user.name}" src="${d.user.icon}" width="40" height="40"/>
                    <b>${d.user.name}</b>

                <div class="float-end">
                    ${public ? `<i class="am-header-icon am-icon-close mr-2" data-action="user_public_remove"></i>` : ''}
                    <button class="am-btn  ${e ? '' : 'am-btn-danger'}" data-action="user_follow">${e ? '取消关注' : '关注'}</button>
                </div>
               </li>
            `
        }

        $('#user_list').html(`<ul class="am-list am-list-static am-list-border">${h}</ul>`);
    },



    video_get(uid, vid) {
        return this.list[uid].list[vid];
    },

    update(ids) {
        if (!ids) ids = Object.keys(this.list);
        if (!Array.isArray(ids)) ids = [ids];
        for (let id of ids) {
            let d = this.list[id];
            if (!d) return;

            let r = '';
            let i = 0;
            for (let vid of Object.keys(d.list).sort((a, b) => b - a)) {
                let item = d.list[vid];
                if (!item.last) {
                    r += `
                    <li data-vid="${vid}" class="video_item position-relative" data-index=${i++}>
                      <span class="am-badge am-badge-primary position-absolute" style="top:0;left:5px;">${time_getRent(item.time)}</span>
                      <img title="${item.desc}" class="am-thumbnail mx-auto lazyload" src="${item.cover}" data-action="video_play"  />
                      <div class="d-flex justify-content-around">
                        <a class="like"><i class="am-header-icon am-icon-heart-o mr-2"></i>${numToStr(item.like)}</a>
                        <a class="comment"><i class="am-header-icon am-icon-commenting-o mr-2"></i>${numToStr(item.comment)}</a>
                        <a class="share"><i class="am-header-icon am-icon-share mr-2"></i>${numToStr(item.share)}</a>
                      </div>
                    </li>
                  `
                }
            }

            let target = domSelector({ uid: id }, '.user_recent');
            if (i > 0) {
                let h = $(`
                 <div class="user_recent am-u-sm-12 " data-uid="${id}">
                     <img data-action="user_homepage" class="am-circle mx-auto mr-2" title="${d.user.name}" src="${d.user.icon}" width="40" height="40"/>
                    <b>${d.user.name}</b>
                    <span class="am-badge am-badge-danger me-2">${i}</span>
                    <div class="float-end">
                        <small class="mr-2">${time_getRent(d.lastUpdateTime)}</small>
                        <button class="am-btn" data-action="user_menu"><span class="am-icon-caret-down"></span></button>
                    </div>
                    <div id="video_list" class="mt-10">
                        <ul class="am-avg-sm-2 am-avg-md-4 am-avg-lg-6 am-thumbnails">
                            ${r}
                        </ul>
                    </div>
                  </div>
                `);
                if (!target.length) {
                    $('#update_main').append(h);
                } else {
                    target.replaceWith(h);
                }
                domSelector('videos_readedAll').removeClass('hide');
                h.find('.lazyload').lazyload();
            } else {
                target.remove();
            }
        }
    },

    data_resetDate() {
        for (let id in this.list) {
            let d = this.list[id];
            d.list = {};
            d.lastVideo = 0;
        }
        toast('成功重置', 'success')
        this.save();
    },



    getVideoDetail(item) {
        return {
            time: this.video_getTime(item),
            comment: item.statistics.comment_count,
            like: item.statistics.digg_count,
            share: item.statistics.share_count,
            desc: item.desc,
            vid: item.video.vid,
            duration: item.video.duration,
            cover: item.video.cover.url_list[0],
            video: item.video.play_addr.url_list[2], // 第3,4链接不会过期
            // video: 'http://127.0.0.1:8002/api/video?id=' + id,
        }
    },

    account_checkNew(ids) {
        toast('更新中...', 'primary');
        if (ids === undefined) ids = Object.keys(this.list);
        if (!Array.isArray(ids)) ids = [ids];

        let i = 0;
        let done = () => {
            this.save();
            $.AMUI.progress.done();
            clearTimeout(timer);
            alert('更新完毕');
        }

        let timer = setTimeout(() => done(), 1000 * 30);

        const parseItem = (id, detail) => {
            let d = this.get(id);
            if (!d || !detail) return;
            if (!detail.aweme_list.length) return;

            let newst = 0;
            for (let item of detail.aweme_list) {
                let vid = item.aweme_id;
                newst = Math.max(vid, newst);

                let obj;
                if (Number(vid) > Number(d.lastVideo)) { // 没看过
                    // 没有发布时间数据，但id是递增的
                } else
                if (d.list[vid]) { // 更新数据
                    if (d.list[vid].last) { // 已经看过，直接删除
                        delete d.list[vid];
                        continue;
                    }

                } else {
                    // 不是最新的且没看过 -> 直接跳过
                    continue;
                }
                d.list[vid] = g_douyin.getVideoDetail(item)
            }

            d.lastVideo = newst; // 最新ID
            d.lastUpdateTime = new Date().getTime();
            this.update(id)
        }

        if (g_cache.isWeb) {
            let send = {}
            for (let id of ids) send[id] = this.list[id].lastVideo;

            // 一次性发送解析
            $.ajax({
                    url: g_api + 'batch.php',
                    type: 'POST',
                    dataType: 'json',
                    data: { list: send },
                })
                .done(function(ret) {
                    for (let uid in ret) {
                        parseItem(uid, ret[uid]);
                    }
                    done();
                })
                .fail(function() {
                    toast('更新失败', 'danger');
                })
            return;
        }


        for (let id of ids) {
            this.douyin_fetchVideos(id, data => {
                parseItem(id, data);
                $.AMUI.progress.set(++i / ids.length);
                if (i == ids.length) {
                    done();
                }
            });
        }
    },


}

g_douyin.init();