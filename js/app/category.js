
var g_category = {
    category_set(name, opts) {
        this.list[name] = opts
        this.update()
    },
    category_remove(name) {
        delete this.list[name]
    },
    sidebar_register() {
        g_sidebar.register('left', {
            html: `<div>
                <div id="icons_left" class="d-flex m-2">
                    <i class="ti ti-menu-2 fs-2" data-action="menu" title="菜单"></i>
                    <i class="ti ti-plus fs-2" data-action="" title="添加"></i>
                    <i class="ti ti-icons fs-2" data-action="icon_test" title="图标"></i>
                    <i class="ti ti-trash text-danger fs-2" data-action="db_clear" title="清空数据库"></i>
                    <i class="ti ti-keyboard fs-2" data-action="modal_hotkey" title="快捷键"></i>
                </div>

                <div id="group_list" class="p-2 pt-0 overflow-x-hidden overflow-y-auto" style="height: calc(100vh - 80px);"></div>

                <div class="d-flex w-full position-absolute bottom-0 p-2">
                    <a tabindex="-1" title="插件" class="btn btn-pill btn-ghost-primary" href="#dropdown-plugin" data-bs-toggle="dropdown" data-bs-auto-close="outside" role="button" aria-expanded="false"><i class="ti ti-plug"></i></a>
                    <div class="dropdown-menu" id="dropdown-plugin">
                        <h6 class="dropdown-header">插件</h6>
                        <a class="dropdown-item" data-action="modal_plugin">
                            插件管理
                        </a>
                        <div class="dropdown-divider"></div>
                    </div>
                    <a tabindex="-1" data-action="settings,general" title="设置" class="btn btn-pill btn-ghost-warning"><i class="ti ti-settings"></i></a>
                    <a tabindex="-1" title="其他" class="btn btn-pill btn-ghost-primary" href="#dropdown-more" data-bs-toggle="dropdown" data-bs-auto-close="outside" role="button" aria-expanded="false"><i class="ti ti-dots"></i></a>
                    <div class="dropdown-menu" id="dropdown-more">
                        <h6 class="dropdown-header">软件</h6>
                        <a class="dropdown-item" data-action="homepage">
                            <i class="ti ti-brand-github fs-2"></i>
                            项目主页
                        </a>
                        <a class="dropdown-item" onclick="ipc_send('url', 'https://www.52pojie.cn/thread-1688063-1-1.html')">
                            <i class="ti ti-brand-hipchat fs-2"></i>
                            52pojie
                        </a>
                        <a class="dropdown-item" data-action="update_check">
                            <i class="ti ti-clock-2 fs-2"></i>
                            检测更新
                            <span id="badge_update" class="badge bg-danger ms-auto">News</span>
                        </a>
                        <a class="dropdown-item" data-action="about">
                            <i class="ti ti-alert-circle fs-2"></i>
                            关于
                            <span class="badge bg-primary ms-auto">1.0.2</span>
                        </a>
                    </div>
                </div>

            </div>`,
            style: `
                #sidebar_left {
                    left: 0;
                    top: 0;
                    margin-left: 0px;
                    height: 100vh;
                    width: var(--offset-left);
                }
                #sidebar_left.hideSidebar {
                    margin-left: calc(0px - var(--offset-left));
                }
                main[sidebar-left]{
                    padding-left: var(--offset-left);
                }
            `, // var(--offset-top)
            onShow: e => {
                setCssVar('--offset-left', '250px')
            },
            onHide: e => {
                setCssVar('--offset-left', '0px')
            },
        })
    },
    init() {
        const self = this
        this.list = {
            default: {
                title: '常用',
                list: {
                    all: {
                        title: `全部<span class="badge badge-outline text-blue ms-2" id="badge_all">0</span>`,
                        icon: 'inbox',
                        action: 'category,all',
                        editAble: false,
                    },
                    noFolder: {
                        title: '未分类<span class="badge badge-outline text-blue ms-2" id="badge_noFolder">0</span>',
                        icon: 'question-mark',
                        action: 'category,noFolder',
                    },
                    noTag: {
                        title: '未标签<span class="badge badge-outline text-blue ms-2" id="badge_noTag">0</span>',
                        icon: 'tags-off',
                        action: 'category,noTag',
                    },
                    // recent: {
                    //     title: '最近使用<span class="badge badge-outline text-blue ms-2" id="badge_recent">0</span>',
                    //     icon: 'history',
                    //     action: 'category,recent',
                    // },
                    random: {
                        title: '随机模式',
                        icon: 'arrows-random',
                        action: 'category,random',
                    },
                    // tags: {
                    //     title: '标签管理<span class="badge badge-outline text-blue ms-2" id="badge_list">0</span>',
                    //     icon: 'tags',
                    //     action: 'tags_list',
                    // },
                    trash: {
                        title: '回收站<span class="badge badge-outline text-red ms-2" id="badge_trash">0</span>',
                        icon: 'trash',
                        action: 'category,trash',
                        menu: 'menu_trash',
                    },
                },
            },

        }
        self.sidebar_register()
        g_dropdown.register('actions_default', {
            position: 'top-end',
            offsetLeft: 5,
            onShow: function(e) {
                this.opts.list = {
                    edit: {
                        title: '编辑',
                        icon: 'pencil',
                        action: 'filter_edit',
                    },
                    delete: {
                        title: '删除',
                        icon: 'trash',
                        class: 'text-danger',
                        action: 'filter_delete',
                    }
                }
            },
        })

        g_action.registerAction(['filter_edit', 'filter_delete'], (dom, action) => {
            let name = g_dropdown.target.parents('[data-name]').data('name')
            switch (action[1]) {
                case 'filter_edit':
                    return;

                case 'filter_delete':
                    return;
            }
        }).
        registerAction({
            category_opts: (dom, action) => {
                if (self.actions[action[1]]) self.actions[action[1]](dom, action)
            },
            category: (dom, action) => {
              g_datalist.rule_new(g_filter.getPreset(action[1]))
            }
        })

        g_category.
        registerAction('default', (dom, action, e) => {
            let folder = action[2]
            self.menu_folder = folder
            g_dropdown.show('actions_default', dom)
        })

        $(() => this.update())
    },

    // 注册更多选项action
    actions: {},
    registerAction(action, callback) {
        this.actions[action] = callback
    },

    item_html(name, group, item, action = '') {
        return `
            <div class="row align-items-center m-1">
                <a class="list-group-item list-group-item-action col text-nowarp" data-action="${action}" data-list="${group}" data-name="${name}">
                    ${item.icon ? `<i class="me-2 ti ti-${item.icon}"></i>` : ''}
                    ${item.title}
                </a>
                ${item.editAble !== false ? `
                    <div class="col-auto" >
                        <a data-action="${item.menu || `category_opts,${group},${name}`}">
                            <i class="ti ti-dots"></i>
                        </a>
                    </div>
                ` : ''}
            </div>
        `
    },

    update: function() {
        let self = this
        // 注册侧边栏
        let datas = []
        for (let [group, data] of Object.entries(this.list)) {
            for (let [name, item] of Object.entries(data.list)) {
                datas.push({
                    html: this.item_html(name, group, item, item.action || data.action || ''),
                    group,
                })
            }
        }
        $('#sidebar_left').addClass('border-end').find('#group_list').html(g_tabler.build_accordion({
            id: 'group',
            datas,
            header: '{title}',
            default: true,
            parent: false,
            onOpen: e => {
                let group = e.currentTarget.dataset.collapse
            },
            collapse_start: `<div class="list-group list-group-flush">`,
            collapse_end: `</div>`,
        }))

        $(`[data-list="folder"]`).prop('draggable', true)
        // let last = g_setting.getConfig('lastGroup', '')
        // last.length && self.group_load(last)
    },
}

g_category.init()