g_ui.register('foll_updates', {
    container: '#main_content',
    html: `
<div class="page-header">
    <div class="container-xl">
        <div class="row g-2 align-items-center">
            <div class="col d-flex overflow-x-auto mt-2" id="following_list">
            </div>
            <div class="col-12 col-md-auto ms-auto">
                <a class="btn" data-action="following_add">
                    <i class="ti ti-plus fs-2"></i>
                </a>
            </div>
            <div class="col-12 col-md-auto ms-auto ">
                <a class="btn btn-primary" data-action="following_updateAll">
                    <i class="ti ti-refresh fs-2"></i>
                </a>
                <a class="btn btn-danger" data-action="foll_readAll">
                    <i class="ti ti-check fs-2"></i>
                </a>
            </div>
        </div>
    </div>
</div>
<div class="page-body">
    <div class="container-xl">
        <div class="row g-4 mt-2">
            <div class="col-2 border-end">
                <div>
                    <div class="form-label">条件过滤</div>
                    <div class="mb-4" id="filter_videos">
                        <label class="form-check">
                            <input type="checkbox" class="form-check-input" name="form_video_filter" value="">
                            <span class="form-check-label">无</span>
                        </label>
                        <label class="form-check">
                            <input type="checkbox" class="form-check-input" name="form_video_filter" value="unread">
                            <span class="form-check-label">未观看</span>
                        </label>
                    </div>
                    <div class="form-label">分类</div>
                    <div class="mb-4">
                        <select class="form-select">
                            <option selected>全部</option>
                            <option>国学</option>
                            <option>育儿</option>
                            <option>商业</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="col-10 overflow-y-auto" style="height: calc(100vh - 150px);" id="update_list">
            </div>
        </div>
    </div>
</div>
    `,
    onHide(hide) {
        if (!hide) {
            g_setting.apply('videos_filters')
        }
    },
})

$('#following_list').on('mousewheel', function(e) {
    this.scrollLeft += e.originalEvent.deltaY
})

g_input.bind({
    form_video_filter() {
        let selected = []
        $('#filter_videos input:checked').each((i, input) => selected.push(input.value))
        // setConfig('videos_filters', selected.join(','))
        console.log(selected)
    }
})

g_setting.onSetConfig({
    videos_filters: vals => {
        if (!isEmpty(vals)) {
            vals = vals.split(',')
            for (let input of $('[name="form_video_filter"]')) {
                console.log(vals, input.value)
                input.checked = vals.includes(input.value)
            }
        }
        g_foll.refresh()
    },
})


$(function() {
    g_ui.show('foll_updates')
});

g_menu.registerMenu({
    name: 'user_icon_item',
    selector: '.user_icon',
    dataKey: d => getParentAttr(d, 'data-uid'),
    html: g_menu.buildItems([{
        icon: 'home',
        text: '查看主页',
        action: 'user_item_homepage'
    }, {
        icon: 'trash',
        text: '取消关注',
        class: 'text-danger',
        action: 'user_item_delete'
    }])
});

g_action.registerAction(['user_item_homepage'], (dom, action) => {
    let id = g_menu.key
    // let d = self.get(id)
    switch (action[0]) {
        case 'user_item_homepage':
            g_user.user_homepage(id)
            break;
    }
    g_menu.hideMenu('user_icon_item')
})

g_action.registerAction({
    foll_readAll() {
        confirm('确定一键已读所有视频吗', {
            title: '一键已读',
        }).then(() => {
            let now = new Date().getTime();
            for (let uid in g_foll.list) {
                let d = g_foll.list[uid];
                for (let id in d.list) {
                    d.list[id].lastView = now;
                }
            }
            g_foll.save();
        });
    },
    foll_delete(dom) {
        let uid = getParentAttr(dom, 'data-uid')
        let d = g_foll.get(uid)
        confirm('你确定取消关注 【' + d.user.name + '】 吗?', {
            title: '取消关注',
            type: 'danger'
        }).then(() => {
            g_foll.remove(uid)
        })
    },
    following_add() {
        let h = getClipboardText()
        if (!h.startsWith('http')) h = ''
        prompt(h, {
            title: '输入用户主页URL',
        }).then(url => g_foll.link_parse(url))
    },
    following_updateAll: () => g_foll.update_userVideos(),
    following_video_clear() {
        confirm('你确定重置所有已读视频吗?', {
            title: '重置视频',
            type: 'danger'
        }).then(() => {
            g_foll.each(item => {
                item.list = {}
                item.lastUpdateTime = 0
                item.lastVideo = 0
            })
            g_foll.save()
        })
    },
    foll_icon_click(dom) {
        let card = g_foll.get_card(dom.dataset.uid)[0]
        card && card.parentElement.scrollTo(0, card.offsetTop)
    },
    video_click(dom) {
        g_video.target = dom
        let json = getParentAttr($(dom), 'data-json')
        if(json){
            g_video.video_load(JSON.parse(json))
        }else{
            let uid = getParentAttr($(dom), 'data-uid')
            let vid = getParentAttr($(dom), 'data-vid')
            g_video.video_load({ uid, vid })
        }
    }
})

Object.assign(g_foll, {
    // 更新视频
    update_userVideos(ids) {
        if (ids == undefined) {
            ids = this.ids
        } else
        if (!Array.isArray(ids)) ids = [ids];
        let max = ids.length
        if (max == 0) return

        let err = 0
        let btn = getEle('following_updateAll').addClass('btn-loading')

        let stop = false
        let done = () => {
            stop = true
            btn.removeClass('btn-loading')
            toast(err ? err + '个账号更新失败' : '成功更新' + max + '个账号')
            g_foll.save()
        }
        let next = () => {
            if (stop) return
            $('.foll_icon_updateing').removeClass('foll_icon_updateing')
            let uid = ids.shift()
            if (uid == undefined) {
                done();
            } else {
                g_foll.get_icon(uid).addClass('foll_icon_updateing')[0].scrollIntoViewIfNeeded()
                try {
                    g_api.douyin_fetchVideos(uid, data => {
                        let d = g_foll.list[uid]
                        if (d && data && data.aweme_list.length) {
                            let newst = 0;
                            for (let item of data.aweme_list) {
                                let vid = item.aweme_id;
                                newst = Math.max(vid, newst);

                                let obj;
                                if (Number(vid) > Number(d.lastVideo)) { // 没看过
                                    // 没有发布时间数据，但id是递增的
                                    // console.log('没看过')
                                } else
                                if (d.list[vid]) { // 更新数据
                                    if (d.list[vid].lastView) {
                                        delete d.list[vid];
                                        // console.log('已经看过，直接删除')
                                        continue;
                                    }
                                } else {
                                    // console.log('不是最新的且没看过 -> 直接跳过')
                                    continue;
                                }
                                d.list[vid] = g_api.getVideoDetail(item)
                            }
                            d.lastVideo = newst; // 最新ID
                            d.lastUpdateTime = new Date().getTime();
                            // g_foll.update_user(uid)
                        } else {
                            err++
                        }
                        next()
                    });
                } catch (e) {
                    err++
                }
            }
        }
        for (let i = 0; i < Math.min(10, ids.length); i++) next()
    },

    // 解析用户链接并添加
    link_parse(url) {
        g_api.douyin_parseUser(url, d => {
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

    // 刷新用户展示
    refresh() {
        let h = ''
        let h1 = ''
        this.ids = Object.keys(this.list).sort((a, b) => {
            let a1 = this.list[a]
            let b1 = this.list[b]
            // 未观看视频较多的排前
            return Object.values(b1.list).filter(item => !item.lastView).length - Object.values(a1.list).filter(item => !item.lastView).length
        }) // 保存排序顺序 确定更新显示时不会乱跳
        for (let k of this.ids) {
            let v = this.list[k]
            h += this.parse_icon(k, v)
            h1 += this.parse_card(k, v)
        }
        $('#following_list').html(h)
        $('#update_list').html(h1)
    },

    // 获取用户图标DOM
    get_icon(uid) {
        return getEle({ uid, action: 'foll_icon_click' }, '#following_list ')
    },

    // 获取用户卡片DOM
    get_card(uid) {
        return getEle({ uid }, '#update_list .card')
    },

    // 获取用户卡片内的视频DOM
    get_item(vid) {
        return getEle({ vid }, '#update_list .card')
    },

    // 更新用户视图
    update_user(uid) {
        if (!Array.isArray(uid)) uid = [uid]
        uid.forEach(uid => {
            let h = this.parse_icon(uid)
            let icon = this.get_icon(uid)

            if (!icon.length) {
                icon = $(h).appendTo('#following_list')
            } else {
                icon.replaceWith(h)
            }

            let h1 = this.parse_icon(uid)
            let card = this.get_card(uid)
            if (!card.length) {
                card = $(h).appendTo('#update_list')
            } else {
                card.replaceWith(h1)
            }
        })
    },

    // 获取用户图标结构
    parse_icon(k, v, i) {
        if (!v) v = this.get(k)
        if (i == undefined) i = Object.values(v.list).filter(item => !item.lastView).length
        return `
             <div class="m-2" data-uid="${k}" data-action="foll_icon_click">
                <span class="avatar user_icon" title="${v.user.name}" style="background-image: url(${v.user.icon})">
                    <span class="badge bg-blue badge-notification badge-pill ${i == 0 ? 'hide' : ''}">${i}</span>
                </span>
            </div>
        `
    },

    // 获取用户卡片结构
    parse_card(k, v) {
        if (!v) v = this.get(k)
        let h = ''
        let filters = getConfig('videos_filters', '').split(',')
        for (let vid of Object.keys(v.list).sort((a, b) => {
                return b - a
            })) {
            let item = v.list[vid]
            if (filters.includes('unread') && item.lastView) continue
            h += `
            <div class="card card-sm col-3 mt-2" data-vid="${vid}">
               <div class="ribbon ribbon-top ribbon-start bg-primary w-unset fs-5 p-1">
                <b>${time_getRent(item.time)}</b>
              </div>
               <div class="ribbon ribbon-bottom ribbon-end bg-white w-unset fs-5 p-1" style="bottom: 40px;">
                <a class="ms-3 text-muted" data-action="coll_toggle">
                    <i class="ti ti-star fs-2 mr-2 ${g_coll.exists(item.aid) ? 'text-warning' : ''}"></i>
                </a>
              </div>

                <a class="d-block">
                    <img src="${item.cover}" class="card-img-top w-full" data-loadvideo data-action="video_click" >
                </a>
                <div class="card-body p-1">
                    <div class="d-flex align-items-center">
                        <div class="ms-auto">
                            <a  class="text-muted">
                                <i class="ti ti-heart fs-2 mr-2 ${item.like >= 1000 ? 'text-danger' : ''}"></i>${numToStr(item.like)}
                            </a>
                            <a  class="ms-3 text-muted">
                                <i class="ti ti-message-circle fs-2 mr-2"></i>${numToStr(item.comment)}
                            </a>
                            <a  class="ms-3 text-muted">
                                <i class="ti ti-share fs-2 mr-2"></i>${numToStr(item.share)}
                            </a>
                        </div>
                    </div>
                </div>
            </div>`
        }
        return h ? `<div class="card" data-uid="${k}">
            <div class="card-header bg-auto sticky-top p-2">
                <div>
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <span class="avatar avatar-rounded user_icon" style="background-image: url(${v.user.icon})"></span>
                        </div>
                        <div class="col">
                            <div class="card-title"><a href="#" data-action="user_homepage">${v.user.name}</a></div>
                            <div class="card-subtitle">最后更新于${time_getRent(v.lastUpdateTime)}</div>
                        </div>
                    </div>
                </div>
                <div class="card-actions me-2">
                    <a  class="btn btn-danger">
                        <i class="ti ti-trash" data-action="foll_delete"></i>
                    </a>
                    <a  class="btn btn-outside">
                        <i class="ti ti-dots"></i>
                    </a>
                </div>
            </div>
            <div class="card-body row">
                ${h}
            </div>
        </div>` : ''
    },
})