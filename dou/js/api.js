var g_api = {

    // https://www.52pojie.cn/thread-1266439-1-1.html
    douyin_fetchID(id, callback) {
        netRequest('https://www.douyin.com/video/'+id).then(resp => {
            resp.text().then(body => {
                try {
                    let text = cutString(body, '<script id="RENDER_DATA" type="application/json">', '</script>')
                    let json = JSON.parse(decodeURIComponent(text, true))
                    callback({item_list: [json['41'].aweme.detail]})
                } catch (err) {
                    // 滑动验证码
                    console.error(err)
                }
            })
        })
    },

    getParmams(args = {}) {
        return Object.entries(Object.assign({
            aid: 6383,
            channel: 'channel_pc_web',
            pc_client_type: 1,
            version_code: 170400,
            version_name: '17.4.0',
            cookie_enabled: true,
            screen_width: 1920,
            screen_height: 1080,
            browser_language: 'zh-CN',
            browser_platform: 'Win32',
            browser_name: 'Edge',
            browser_online: true,
            engine_version: '108.0.0.0',
            os_name: 'Windows',
            os_version: 10,
            cpu_core_num: 8,
            device_memory: 8,
            platform: 'PC',
            downlink: 10,
            effective_type: '4g',
        }, args)).map(([k, v]) => k + '=' + v).join('&')
    },

    getComment(opts, callback) {
        netRequest(`https://www.douyin.com/aweme/v1/web/comment/list/?` + this.getParmams(opts)).then(d => {
            d.json().then(data => {
                callback(data)
            })
        })
    },

    getVideoDetail(item, user = false) {
        let {video} = item
        let r = {
            time: this.video_getTime(item),
            comment: item.stats ? item.stats.commentCount : item.statistics.comment_count,
            like: item.stats ? item.stats.diggCount : item.statistics.digg_count,
            comment: item.stats ? item.stats.shareCount : item.statistics.share_count,
            desc: item.desc,
            aid: item.awemeId || item.aweme_id,
            // vid: video.vid || '',
            shop: item.aweme_anchor_info && item.aweme_anchor_info.title_tag == '购物' ? item.aweme_anchor_info.title_tag : undefined,
            duration: video.duration,
            cover: Array.isArray(video.cover) ? video.cover.url_list[0] : video.cover,
            poster: video.originCover || (Array.isArray(video.dynamic_cover) ? video.dynamic_cover.url_list[0] : video.dynamicCover),
            // video: video.play_addr.url_list[2], // 第3,4链接不会过期
            video: video.playApi || "https://aweme.snssdk.com/aweme/v1/play/?video_id=" + video.play_addr.uri, // + "&ratio=720p&line=0"
        }
        if (user) r.user = this.getUserDetail(item)
        return r
    },

    getUserDetail(item){
        let author = item.authorInfo || item.author
        return {
            uid: author.secUid || author.sec_uid,
            name: author.nickname,
            icon: author.avatarUri || author.avatar_thumb.url_list[0]
        }
    },

    video_getTime(item) {
        let u = url => typeof(url) == 'string' && url.split('_').at(-1);
        let t = item.createTime || [u(item.video.cover.uri), item.video.dynamic_cover ? u(item.video.dynamic_cover.uri) : 0, u(item.video.origin_cover.uri)].find(t => {
            return !isNaN(parseInt(t));
        })
        return parseInt(t + '000')
    },

    // 用户所有视频
    douyin_fetchVideos(opts, callback) {
        return new Promise(reslove => {
            if (typeof(opts) != 'object') opts = { uid: opts };
            opts = Object.assign({
                count: 10,
                cursor: 0
            }, opts)
            netRequest(`https://www.douyin.com/aweme/v1/web/aweme/post/?` + this.getParmams({
                sec_user_id: opts.uid,
                count: opts.count,
                max_cursor: opts.cursor
            })).then(d => {
                d.json().then(data => {
                    let ok = true
                    if (!data) {
                        data = { aweme_list: [] }
                        ok = false
                    }
                    callback(data);
                    reslove(ok)
                })
            })
        })
    },

    // 返回用户视频且附有用户信息
    douyin_fetchVideos1(opts, callback) {
        let r = {
            list: {},
        }
        this.douyin_fetchVideos(opts, ({ aweme_list }) => {
            if (!r.uid) {
                let author = aweme_list[0].author
                r.uid = author.sec_uid
                r.name = author.nickname
                r.icon = author.avatar_thumb.url_list[0]
            }
            r.list = aweme_list.map(item => this.getVideoDetail(item))
            callback(r)
        })
    },

    douyin_videoDetail(vid) {
        return new Promise((reslove, reject) => this.douyin_fetchID(vid, data => {
            if (data.item_list && data.item_list.length) {
                let detail = data.item_list[0]
                reslove(Object.assign(this.getVideoDetail(detail), {user: this.getUserDetail(detail)}))
            }
            reject()
        }))
    },

    // 获取用户信息
    douyin_fetchUser(id, callback) {
        fetch('https://www.iesdouyin.com/web/api/v2/user/info/?sec_uid=' + id).then(d => {
            d.json().then(function(data) {
                let user = data.user_info;
                callback({
                    sec_uid: user.sec_uid,
                    icon: user.avatar_thumb.url_list[0],
                    videos: user.aweme_count,
                    followers: user.follower_count,
                    following: user.following_count,
                    name: user.nickname,
                    desc: user.signature,
                    like: user.total_favorited,
                })
            })
        })
    },

    // 获取短链接
    douyin_shortenURL(url) {
        return new Promise((resolve, reject) => {
            fetch(('https://www.douyin.com/aweme/v1/web/shorten/?targets=' + url + '&belong=aweme&persist=1&device_platform=webapp&aid=6383&channel=channel_pc_web&version_code=170400&version_name=17.4.0&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Edge&browser_version=104.0.1293.54&browser_online=true&engine_name=Blink&engine_version=104.0.5112.81&os_name=Windows&os_version=7&cpu_core_num=8&device_memory=8&platform=PC&downlink=10&effective_type=4g&round_trip_time=50&webid=7072552679137986088&msToken=14DDa3xu6SCAfn98NLCt6_j2Z0joJ9BMs2QRF-EZLXR9ergnXp-NyB5lqEaKbWjpyOrQ6NNzO27U7APpZej5gMCp-Y9lxvh3OVHCfqa0CxCiF-M_VEV8hxo=&X-Bogus=DFSzsdVuissANCs8S6bSTJ6Ve/ru&_signature=_02B4Z6wo00001lzIvNgAAIDBfljtmni8xMZczLhAAPXebvZpCnNWsNcpPC.c2wgL6q-T6K1ZOJTX8lsR2tl-ovm8IID.D4GL7z.1rgbPnkpVChkLiiXl9td5VB9cJlCsWxuGHr5bDU7UpsOAb4')).then(d => {
                d.json().then(function(data) {
                    resolve(data.short_url_list[0].short_url)
                })
            })
        })
    },

    // 解析URL
    douyin_parseUser(url, callback) {
        let err = () => toast('解析失败,请检查链接是否正确', 'danger');
        let check = url => {
            let id = cutString(url + '?', '/user/', '?');
            if (id == '') return err();
            g_api.douyin_fetchUser(id, callback);
        }

        if (url.indexOf('v.douyin.com') == -1) {
            check(url);
        } else {
            fetch(url).then(d => {
                if (d.status == 200 && d.redirected) {
                    check(d.url);
                } else {
                    err();
                }
            })
        }
    },
    douyin_parseUrl(url, callback) {
        // "https://www.douyin.com/video/6869223088110849293?previous_page=app_code_link"
        let err = () => toast('解析失败,请检查链接是否正确', 'danger');
        if (url.indexOf('v.douyin.com') == -1) {
            let id = cutString(url + '?', 'douyin.com/video/', '?');
            if (id == '') {
                return err();
            }
            g_api.douyin_fetchID(id, callback);
        } else {
            this.getRedirectedURL(url).then(ret => g_api.douyin_parseUrl(ret, callback), () => err())
        }
    },

    getRedirectedURL(url) {
        return new Promise((reslove, reject) => {
            fetch(url).then(d => {
                if (d.status == 200 && d.redirected) {
                    reslove(d.url);
                } else {
                    reject();
                }
            })
        })
    }


}

function netRequest(opts) {
    return new Promise(reslove => {
        if (typeof(opts) != 'object') opts = { url: opts }
        const req = nodejs.net.request(Object.assign({
            method: 'GET',
            session: nodejs.remote.session.defaultSession,
            useSessionCookies: true,
            // headers: {
            //     'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            // }
        }, opts))

        let raw = ''
        let cb = () => new Promise(ret => {
            req.on('abort', () => {
                ret(false)
            })
            req.on('response', (response) => {
                if (response.statusCode == 200) {
                    let timeout = setTimeout(() => req.abort(), 5000)
                    response.on('data', data => raw += data.toString())
                    response.on('end', () => {
                        clearTimeout(timeout)
                        ret(raw)
                    })
                } else {
                    ret(false)
                }
            })
            req.end()
        })
        reslove({
            text() {
                return new Promise(reslove => cb().then(raw => reslove(raw)))
            },
            json() {
                return new Promise(reslove => cb().then(raw => reslove(JSON.parse(raw))))
            }
        })
    })

}