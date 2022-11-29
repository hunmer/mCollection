// 一些用户的信息查询

var g_user = {
    init() {
        const self = this
        self.element = g_ui.register('user_homepage', {
            container: '#main_content',
            html: `
<div class="page-header bg-auto">
<div class="container-xl">
  <div class="row align-items-center">
    <div class="col-auto">
      <span class="avatar avatar-rounded" style="background-image: url(...)"></span>
    </div>
    <div class="col">
      <h2 class="page-title"></h2>
      <div class="page-subtitle">
        <div class="row">
          <div class="col-auto">
            <i class="ti ti-heart fs-2 me-2"></i>
            <b>0</b>
          </div>
          <div class="col-auto">
            <i class="ti ti-user fs-2 me-2"></i>
            <b>0</b>
          </div>
          <div class="col-auto">
            <i class="ti ti-users fs-2 me-2"></i>
            <b>0</b>
          </div>
        </div>
      </div>
    </div>
    <div class="col-auto">
      <a href="#" class="btn" data-action="foll_switch">
        关注
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
                            <input type="checkbox" class="form-check-input" name="form_video_filter" value="unread">
                            <span class="form-check-label">未观看</span>
                        </label>
                    </div>
                    <div class="form-label">排序</div>
                    <div class="mb-4">
                        <label class="form-check">
                            <input type="radio" class="form-check-input" name="form-salary" value="1" checked="">
                            <span class="form-check-label">发布时间</span>
                        </label>
                        <label class="form-check">
                            <input type="radio" class="form-check-input" name="form-salary" value="2" checked="">
                            <span class="form-check-label">点赞量</span>
                        </label>
                        <label class="form-check">
                            <input type="radio" class="form-check-input" name="form-salary" value="3">
                            <span class="form-check-label">赞评比</span>
                        </label>
                    </div>
                    <div class="mt-5">
                        <button class="btn btn-primary w-100" data-action="user_videos_loadAll">
                            加载所有视频
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-10 overflow-y-auto row mt-10" style="height: calc(100vh - 150px);" id="user_videos">
            </div>
        </div>
    </div>
</div>
    `,
            onHide(hide) {
                if (!hide) {
                    // g_setting.apply('videos_filters', 'unread')

                    // g_foll.refresh()
                }
            },
        })
        g_action.registerAction({
            user_homepage(dom) {
                self.user_homepage(getParentAttr(dom, 'data-uid'))
            },
            user_videos_loadAll() {
                let clear = () => {
                    if (self.timer) {
                        clearInterval(self.timer);
                        delete self.timer
                    }
                }
                clear()
                self.timer = setInterval(() => {
                    if (!self.loading) {
                        if (self.user_nextPage() === false) {
                            toast('成功加载所有视频!')
                            clear()
                        }
                    }
                }, 500)
            },
            user_video_click(dom) {
                g_video.target = dom
                let data = Object.assign({
                    user: self.user,
                }, self.videos[getParentAttr(dom, 'data-vid')])
                g_video.video_load(data)
            }
        })
        $('#user_videos')[0].onscroll = function(e) {
            if (!self.loading) {
                let top = this.scrollTop;
                if (top + this.offsetHeight + 50 >= this.scrollHeight) {
                    self.user_nextPage();
                }
            }
        }
        // setTimeout(() => self.user_homepage('MS4wLjABAAAAs-MlRqxff9efYytMFV4tJd1gIa5WDQHAAo2LWaAMPwQ'), 500)
    },

    videos: {},
    setLoading(b) {
        this.loading = b
    },

    user_nextPage(opts) {
        if (!opts) opts = this.opts
        if (!opts.hasMore || this.loading) return false
        this.setLoading(true)

        return g_api.douyin_fetchVideos(opts, data => {
            console.log(data)
            opts.hasMore = data.has_more
            this.setLoading(false)

            let h = ''
            let cursor = 999999999999999;
            for (let detail of data.aweme_list) {
                let vid = detail.aweme_id;
                let time = g_api.video_getTime(detail);
                cursor = Math.min(time, cursor);

                let item = g_api.getVideoDetail(detail);
                this.videos[vid] = item

                h += `<div class="card card-sm col-3 mt-2" data-vid="${vid}">
                       <div class="ribbon ribbon-top ribbon-start bg-primary w-unset fs-5 p-1">
                        <b>${time_getRent(item.time)}</b>
                      </div>
                       <div class="ribbon ribbon-bottom ribbon-end bg-white w-unset fs-5 p-1" style="bottom: 40px;">
                        <a class="ms-3 text-muted" data-action="coll_toggle">
                            <i class="ti ti-star fs-2 mr-2 ${g_coll.exists(item.aid) ? 'text-warning' : ''}"></i>
                        </a>
                      </div>

                        <a class="d-block">
                            <img src="${item.cover}" class="card-img-top w-full" data-loadvideo data-action="user_video_click">
                        </a>
                        <div class="card-body p-1">
                            <div class="d-flex align-items-center">
                                <div class="ms-auto">
                                    <a  class="text-muted">
                                        <i class="ti ti-heart fs-2 mr-2"></i>${numToStr(item.like)}
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
            opts.cursor = cursor;
            $('#user_videos').append(h || `<h4 class="text-center mt-3">已经到底了...</h4>`)
        });
    },

    user_homepage(uid) {
        $('#user_videos').attr('data-uid', uid)
        toast('正在获取用户信息', 'primary');
        g_api.douyin_fetchUser(uid, d => {
            let { icon, name } = d
            this.user = { icon, name, uid }

            g_ui.show('user_homepage')
            let exists = g_foll.list[uid];
            let div = this.element

            div.find('.avatar').css('backgroundImage', `url('${icon}')`)
            div.find('.page-title').html(`<a href="#" onclick="ipc_send('url', 'https://www.douyin.com/user/${uid}')">${name}</a>`)
            let stati = div.find('b')
            stati[0].outerText = numToStr(d.like)
            stati[1].outerText = numToStr(d.following)
            stati[2].outerText = numToStr(d.followers)
            div.getEle({ action: 'foll_switch' }).html(exists ? '取消关注' : '关注').replaceClass('btn-', 'btn-' + (exists ? 'danger' : 'outline-danger'))
            this.opts = {
                uid,
                cursor: 0,
                count: 30,
                last: 0,
                hasMore: true,
            }
            this.user_nextPage()
        })
    },
}

g_user.init()