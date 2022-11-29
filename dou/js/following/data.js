var g_foll = {
    init() {
        const self = this
        self.list = local_readJson('following', {
        });
    },

    add(key, vals) {
        this.set(key, Object.assign({
            lastUpdateTime: 0, // 最后检测更新时间
            lastVideo: 0, // 最后发布的视频ID
            list: {}, // 未看列表
            group: '', // 分组
            desc: ''
        }, vals));
    },

    set(key, vals) {
        this.list[key] = vals;
        this.save();
    },

    getVideo(uid, vid, withUser = false) {
        let d = this.get(uid)
        let v = d.list[vid]
        if (withUser) {
            v = Object.assign({}, v, { user: Object.assign({ uid }, d.user) })
        }
        return v
    },

    get(key) {
        return this.list[key];
    },

    remove(key) {
        delete this.list[key];
        this.save();
    },

    save(refresh = true) {
        local_saveJson('following', this.list);
        refresh && this.refresh();
    },

    entries(callback) {
        for (let [k, v] of Object.entries(this.list)) {
            if (callback(k, v) === false) return
        }
    },

    each(callback) {
        for (let k in this.list) {
            if (callback(this.list[k], k) === false) return
        }
    },

}

g_foll.init()