var g_account = {
    init() {
        const self = this
        self.list = local_readJson('accounts', {

        });
        self.refresh()
    },

    add(key, vals) {
        this.set(key, vals);
    },

    set(key, vals) {
        this.list[key] = Object.assign({
            tabs: {
                tab1: {
                    url: 'https://creator.douyin.com/',
                    title: '创作者服务中心',
                }
            }
        }, vals);
        this.save();
    },

    get(key) {
        return this.list[key];
    },

    reset() {
        this.list = {}
        this.save()
    },

    remove(key) {
        delete this.list[key];
        g_browser.group_remove(key)
        this.save();
    },

    save(refresh = true) {
        local_saveJson('accounts', this.list);
        refresh && this.refresh();
    },

    extraList: {
        default: {
            html: `
                <span class="avatar avatar-rounded bg-primary text-light" title="浏览器">
                    <i class="ti ti-world"></i>
                </span>
            `,
            tabs: {
                tab1: {url: 'https://www.baidu.com/', title: '默认主页'}
                // tab1: {url: 'https://www.chanmama.com/tikGoodsRank/hot?big_category=%E5%9B%BE%E4%B9%A6%E9%9F%B3%E5%83%8F&first_category=&second_category=', title: '蝉妈妈'}
            }
        }
    },
    entries(callback) {
        for (let [k, v] of Object.entries(Object.assign({}, this.extraList, this.list ))) {
            if (callback(k, v) === false) return
        }
    },

    each(callback) {
        for (let k in this.list) {
            if (callback(this.list[k], k) === false) return
        }
    },

    init_tabs() {
        let h = ''
        let tabs = {}
        this.entries((k, v) => {
            tabs[k] = v.tabs
            h += `
                <div class="card mb-2 pb-3 _content" data-site="${k}">
                    <div class="card-header p-0">
                        <div class="input-group input-group-flat">
                            <span class="input-group-text">
                                <a data-action="web_back" class="link-secondary fs-2 mr-2 disabled" title="后退" data-bs-toggle="tooltip">
                                    <i class="ti ti-arrow-narrow-left"></i>
                                </a>
                                <a data-action="web_forward" class="link-secondary fs-2 mr-2 disabled" title="前进" data-bs-toggle="tooltip">
                                    <i class="ti ti-arrow-narrow-right"></i>
                                </a>
                                <a data-action="web_refresh" class="link-secondary fs-2 mr-2" title="刷新" data-bs-toggle="tooltip">
                                    <i class="ti ti-refresh"></i>
                                </a>
                            </span>
                            <input type="text" class="form-control form-control-rounded" autocomplete="off" placeholder="输入URL" data-keyup="keyup_url" id="input_url">
                            <span class="input-group-text">
                                <a data-action="web_newTab" class="link-secondary fs-2" title="新标签" data-bs-toggle="tooltip">
                                    <i class="ti ti-plus"></i>
                                </a>
                                <a data-action="web_go" class="link-secondary ms-2 fs-2 disabled" title="跳转" data-bs-toggle="tooltip">
                                    <i class="ti ti-arrow-big-right"></i>
                                </a>
                            </span>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <group data-group="${k}"></group>
                    </div>
                </div>

            `
        })
        g_browser.data_set(tabs, false)
        for (let group of $('#account_tabs').html(h).find('group')) {
            g_browser.group_bind(group)
        }
    },

    refresh() {
        this.init_accounts()
    },

    init_accounts() {
        let h = ''
        this.entries((k, v) => {
            h += this.parse_icon(k, v)
        })
        $('#account_list').html(h)
    },

    parse_icon(k, v){
        return  `
                <div class="m-3" data-account="${k}">
                    <a class="col-auto position-relative" data-action="account_click">
                        ${v.html || `<span class="avatar avatar-rounded" style="background-image: url(${v.icon || './res/default.jpg'})" title="${v.title}">
                            <span class="badge"></span></span>`}
                    </a>
                </div>
            `
    },

    getIcon(account, selector = '') {
        return getEle({ account }, selector)
    },
    getContent(group, selector = '') {
        return getEle({ group }, 'group' + selector)
    },

}

g_account.init()