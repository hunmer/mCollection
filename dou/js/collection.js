var g_coll = {
    init() {
        const self = this
        self.list = local_readJson('collection', {});
        g_menu.registerMenu({
            name: 'video_item',
            selector: '.card[data-vid]',
            dataKey: 'data-vid',
            items: [{
                icon: 'star',
                text: '收藏',
                class: 'text-warning',
                action: 'video_item_coll_toggle'
            }],
            onShow: () => {
                let vid = g_menu.key
                getEle('video_item_coll_toggle').find('span').html(self.get(vid) ? '取消收藏' : '收藏')
            }
        });

        g_action.registerAction(['video_item_coll_toggle'], (dom, action) => {
            let vid = g_menu.key
            let uid = getParentAttr(g_menu.target, 'data-uid')
            // let d = self.get(id)
            switch (action[0]) {
                case 'video_item_coll_toggle':
                    self.coll_toggleVideo({ uid, vid })
                    break;
            }
            g_menu.hideMenu('video_item')
        })
        g_action.registerAction({
            coll_video_click(dom) {
                g_video.target = dom
                g_video.video_load(self.get(getParentAttr(dom, 'data-vid')))
            },
            coll_remove(dom) {
                g_coll.coll_remove(getParentAttr(dom, 'data-vid'))
            },
            collection_clear(){
                confirm('你确定清空收藏嘛?', {type: 'danger'}).then(() => {
                    self.list = {}
                    self.save()
                })
            },
            collection_updateAll(dom) {
                dom = $(dom)
                let cnt = 0
                let btn = getEle('collection_updateAll')
                let ids = Object.keys(self.list)
                let max = ids.length
                let errors = []

                let next = () => {
                    let aid = ids.shift()
                    if (aid != undefined) {
                        g_api.douyin_fetchID(aid, data => {
                            if (data && data.item_list && data.item_list[0]) {
                                Object.assign(self.list[aid], g_api.getVideoDetail(data.item_list[0]))
                            } else {
                                errors.push(aid)
                            }

                            let pro = parseInt(++cnt / max * 100)
                            if (pro == 100) {
                                btn.html('<i class="ti ti-refresh fs-2"></i>')
                                self.save()
                                errors.length && toast(errors.length + '个视频更新失败', 'danger') // TODO 单击toast单独更新
                            } else {
                                btn.html(pro + '%')
                            }

                        })
                        next()
                    }
                }
                for (let i = 0; i < 6; i++) next()
            },
            coll_toggle(dom) { // 从视频列表
                let uid = getParentAttr(dom, 'data-uid')
                let vid = getParentAttr(dom, 'data-vid')
                let data = getParentAttr(dom, 'data-json')
                if (data) {
                    data = JSON.parse(data) // 文本
                } else {
                    data = getParentData(dom, 'json') // 对象
                    if (!data) {
                        data = g_foll.getVideo(uid, vid, true) // 关注账号的视频
                    }
                }
                self.coll_toggleVideo(data)
            },
            // 显示并激活收藏夹的视频
            coll_video_focus(dom) {
                let vid = getParentAttr(dom, 'data-vid')
                g_ui.show('collection')
                setTimeout(() => {
                    let card = self.getEle(vid).addClass('border-danger')
                    card[0].scrollIntoViewIfNeeded()
                    setTimeout(() => card.removeClass('border-danger'), 2000)
                }, 500)
            },
        })

        g_input.bind({
            form_coll_reverse({ selected }) {
                setConfig('coll_reverse', selected)
                g_coll.refresh()
            },
            form_coll_sort({ val }) {
                setConfig('coll_sort', val)
                g_coll.refresh()
            },
            form_coll_groupBy({ val }) {
                setConfig('coll_groupBy', val)
                g_coll.refresh()
            },
            form_coll_tags() {
                let selected = []
                $('#filter_tags input:checked').each((i, input) => selected.push(input.value))
                console.log(selected)
                setConfig('coll_tags', selected.join(','))
                g_coll.refresh()
            }
        })

        // todo 一次性全部改动
        const apply = (name, val) => $(`[name="${name}"][value="${val}"]`).prop('checked', true)
        g_setting.onSetConfig({
            coll_groupBy: val => apply('form_coll_groupBy', val),
            coll_sort: val => apply('form_coll_sort', val),
            coll_reverse: val => apply('form_coll_reverse', val),
        })

        g_ui.register('collection', {
            container: '#main_content',
            html: `
                <div class="page-body d-flex">
                    <div class="border-end row" style="width: 350px;padding-bottom: 50px;" id="filters_collection">
                        <div style="height: calc(100vh - 150px);" class="overflow-y-auto">
                        <div class="datepicker-inline mb-2 hide" id="collection_datepicker"></div>
                        <div class="form-label">标签</div>
                        <div class="mb-2" id="filter_tags"></div>
                        <div class="mb-2 row">
                            <div class="col-6">
                                <div class="form-label">排序
                                <label class="form-check form-switch float-end">
                                  <input class="form-check-input" type="checkbox" name="form_coll_reverse">
                                  <span class="form-check-label">反序</span>
                                </label>
                                </div>
                                <label class="form-check">
                                    <input type="radio" class="form-check-input" name="form_coll_sort" value="time">
                                    <span class="form-check-label">发布时间</span>
                                </label>
                                <label class="form-check">
                                    <input type="radio" class="form-check-input" name="form_coll_sort" value="like">
                                    <span class="form-check-label">点赞量</span>
                                </label>
                                <label class="form-check">
                                    <input type="radio" class="form-check-input" name="form_coll_sort" value="duration">
                                    <span class="form-check-label">时长</span>
                                </label>
                                <label class="form-check">
                                    <input type="radio" class="form-check-input" name="form_coll_sort" value="" checked>
                                    <span class="form-check-label">无</span>
                                </label>
                                
                            </div>
                            <div class="col-6">
                                <div class="form-label">分组</div>
                                <div class="mb-2">
                                    <label class="form-check">
                                        <input type="radio" class="form-check-input" name="form_coll_groupBy" value="user">
                                        <span class="form-check-label">按发布者</span>
                                    </label>
                                    <label class="form-check">
                                        <input type="radio" class="form-check-input" name="form_coll_groupBy" value="date">
                                        <span class="form-check-label">按收藏日期</span>
                                    </label>
                                    <label class="form-check">
                                        <input type="radio" class="form-check-input" name="form_coll_groupBy" value="none" checked>
                                        <span class="form-check-label">无</span>
                                    </label>
                                </div>
                            </div>
                            <div class="col-6 hide">
                                <div class="form-label">分类</div>
                                <div class="mb-2">
                                    <select class="form-select">
                                        <option selected>全部</option>
                                        <option>国学</option>
                                        <option>育儿</option>
                                        <option>商业</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        </div>
                        <div class="mt-2 hide">
                            <button class="btn btn-primary w-100">
                                保存过滤条件
                            </button>
                            <a class="btn btn-link w-100">
                                重置
                            </a>
                        </div>
                    </div>
                    <div class="ms-2" style="width: calc(100% - 350px);">
                        <div class="p-2">
                            <div class="row g-2 align-items-center">
                                <div class="col d-flex">
                                </div>
                                <div class="col-12 col-md-auto ms-auto">
                                    <a class="btn btn-danger" data-action="collection_clear">
                                        <i class="ti ti-trash fs-2"></i>
                                    </a>
                                </div>
                                <div class="col-12 col-md-auto ms-auto ">
                                    <a class="btn btn-primary" data-action="collection_updateAll">
                                        <i class="ti ti-refresh fs-2"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="overflow-y-auto overflow-x-hidden" id="coll_list" style="height: calc(100vh - 150px);"></div>
                    </div>
                </div>
                    `,
            onHide(hide) {
                if (!hide) {
                    g_setting.apply(['coll_groupBy', 'coll_sort'])
                    g_coll.refresh()
                }
            }
        })

        this.initDates()
        let path = 'js/plugins/litepicker/'
        let picker = new easepick.create({
            element: $('#collection_datepicker')[0],
            lang: 'zh-CN',
            inline: true,
            css: [path + 'index.css', path + 'lock.css'],
            plugins: ['LockPlugin', 'AmpPlugin'],
            AmpPlugin: {
                dropdown: {
                    months: true,
                    years: true,
                },
                resetButton: true,
            },
            buttonText: {
                previousMonth: `<i class="ti ti-chevron-left"></i>`,
                nextMonth: `<i class="ti ti-chevron-right"></i>`,
            },
            LockPlugin: {
                filter(date, picked) {
                    return !self.allowedDates.has(date.format('YYYY-MM-DD'));
                },
            },
        });
        picker.on('select', ({ detail }) => self.refresh());
        picker.on('clear', () => self.refresh());
        this.coll_picker = picker
        // g_ui.show('foll_updates')
    },

    coll_toggleVideo(data) {
        try {
            let vid = data.aid || data.vid
            let callback = () => {
                let added = g_coll.coll_toggle(vid, data)
                toast('成功' + (added ? '收藏' : '取消收藏'))
            }
            // 弹出标签选择
            if (this.get(vid) == undefined) {
                g_form.confirm('coll_save', {
                    elements: {
                        tags: {
                            title: '标签',
                            value: '',
                            type: 'checkbox_list',
                            list: g_tag.tags
                        },
                    },
                }, {
                    id: 'coll_save',
                    title: '收藏视频',
                    btn_ok: '保存',
                    extraButtons: [{
                        text: '新标签',
                        class: 'btn-warning',
                        id: 'tag_new',
                        onClick: e => {
                            prompt('', { title: '输入新标签' }).then(tag => {
                                if (!isEmpty(tag)) {
                                    if (!g_tag.add(tag)) {
                                        return toast('标签已经存在', 'danger')
                                    }
                                    g_form.reload('coll_save')
                                    // g_form.setElementVal('coll_save', 'tags', g_tag.tags, 'list')

                                }
                            })
                            return false
                        },
                    }],
                    onBtnClick: (btn, modal) => {
                        // FIX 新标签后添加收藏无用
                        if (btn.id == 'btn_ok') {
                            Object.assign(data, g_form.getVals('coll_save'))
                            // g_action.do(dom, 'video_download')
                            callback()
                        }
                    }
                })
            } else {
                callback()
            }
        } catch (err) {
            // console.log(err.toString()) // 数据错误的直接移除（遗留问题）
            this.coll_remove(vid)
        }

    },

    // 初始化允许选中日期
    initDates() {
        this.allowedDates = new Set()
        this.entries((key, value) => this.allowedDates.add(new Date(value.time).format('yyyy-MM-dd')))
    },

    coll_remove(vid) {
        let d = this.get(vid)
        if (d) {
            // TODO UNDO 
            // todo 如果这个card里没有其他的元素 则删除整个card...
            g_plugin.callEvent('coll_remove', { vid, d })
            this.getEle(vid).remove() // 从收藏列表移除
            this.remove(vid, false)
            return true
        }
    },

    // 切换收藏 返回是否移除
    coll_toggle(vid, d) {
        let added
        if (this.coll_remove(vid)) {
            added = false
        } else {
            this.set(vid, d, false)
            added = true
            // 自动下载

        }
        this.getEle(vid).find('.ti-star').toggleClass('text-warning', added)
        return added
    },

    coll_count(callback) {
        let i = 0
        this.entries((key, value) => {
            if (callback(key, value)) i++
        })
        return i
    },

    // 刷新用户展示
    refresh(group, tags) {
        if (!group) group = getConfig('coll_groupBy', 'date')
        if (!tags) tags = getConfig('coll_tags', '').split(',').filter(s => s != '')
        let date = this.coll_picker.getDate()
        if (date) {
            let start = date.getTime()
            date = [start, start + 86400 * 1000]
        }
        $('#filter_tags').html(g_tag.getHtml('form_coll_tags', tags, false))

        // 分组
        let r = {}
        let getKey = () => '', getHeader = (k, v) => `
            <div class="row align-items-center">
                <div class="col">
                    <div class="card-title">${k}</div>
                    <div class="card-subtitle">${r[k].length+'个视频'}</div>
                </div>
            </div>`

        switch (group) {
            case 'user':
                getKey = (k, v) => v.user.name
                getHeader = (k, v) => `
                <div class="row align-items-center">
                    <div class="col-auto">
                        <span class="avatar avatar-rounded" style="background-image: url(${v.user.icon})"></span>
                    </div>
                    <div class="col">
                        <div class="card-title">${v.user.name}</div>
                        <div class="card-subtitle">${r[k].length+'个视频'}</div>
                    </div>
                </div>`
                break;

            case 'date':
                getKey = (k, v) => getFormatedTime(4, v.time) // v.time
               
                break;

            default: 
                break;
        }
        for (let [k, v] of Object.entries(this.list)) {
            if (tags.length && !arr_include(tags, v.tags || [])) continue;
            if (date && !(v.time >= date[0] && v.time <= date[1])) continue;
            // 用户分组
            // TODO USER UID
            let key = getKey(k, v)
            if (!r[key]) r[key] = []
            r[key].push(k)
        }

        let h = ''
        let sort = getConfig('coll_sort', '')
        let reverse = getConfig('coll_reverse', false)
        for (let [key, ids] of Object.entries(r)) {
            let h1 = ``
            ids.sort((a, b) => {
                if (sort != '') {
                    let a1 = this.get(a)
                    let b1 = this.get(b)
                    return reverse ? a1[sort] - b1[sort] : b1[sort] - a1[sort]
                }
            }).forEach(vid => {
                let item = this.get(vid)
                if (!h1) {
                    h1 += `
                 <div class="card">
                    <div class="card-header bg-auto sticky-top">
                        <div>
                            ${getHeader(key, item)}
                        </div>
                        <div class="card-actions">
                            <a  class="btn btn-outside">
                                <i class="ti ti-dots"></i>
                            </a>
                        </div>
                    </div>
                    <div class="card-body row">
                 `
                }
                h1 += this.parse_card(vid, item)
            })
            if (h1) {
                h += h1 + `</div></div>`
            }
        }
        $('#coll_list').html(h).find('.lazyload').lazyload()
    },

    // 获取视频卡片结构
    parse_card(k, v) {
        return `<div class="card card-sm col-3 mt-2" data-vid="${k}" data-uid="${v.user.uid}">
             <div class="ribbon ribbon-top ribbon-start bg-primary w-unset fs-5 p-1">
                <b>${time_getRent(v.time)}</b>
              </div>
              
                <a class="d-block"><img src="res/loading.gif" data-src="${v.cover}" class="card-img-top w-full lazyload" data-loadVideo data-action="coll_video_click"></a>
                <div class="card-body p-1">
                    <div class="d-flex align-items-center">
                        <div class="ms-auto">
                            <a  class="text-muted">
                                <i class="ti ti-heart fs-2 mr-2"></i>${numToStr(v.like)}
                            </a>
                            <a  class="ms-3 text-muted">
                                <i class="ti ti-message-circle fs-2 mr-2"></i>${numToStr(v.comment)}
                            </a>
                            <a  class="ms-3 text-muted">
                                <i class="ti ti-share fs-2 mr-2"></i>${numToStr(v.share)}
                            </a>
                        </div>
                    </div>
                </div>
            </div>`
    },

    getEle(vid) {
        return getEle({ vid }, '#coll_list .card')
    },

    add(key, vals, update = true) {
        this.set(key, Object.assign(this.get(key) || {}, vals), update);
    },

    set(key, vals, update = true) {
        this.list[key] = vals;
        this.save(update);
    },

    get(key) {
        return this.list[key];
    },

    exists(key) {
        return this.get(key) != undefined
    },

    remove(key, update = true) {
        delete this.list[key];
        this.save(update);
    },

    save(refresh = true) {
        local_saveJson('collection', this.list);
        refresh && this.refresh();
        this.initDates()
    },

    entries(callback) {
        for (let [k, v] of Object.entries(this.list)) {
            if (callback(k, v) === false) return
        }
    },

    reset() {
        this.list = {}
        this.save()
    }

}

g_coll.init()