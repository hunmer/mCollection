var g_view = {

    item_setWidth(width) {
        width = parseInt(width)
        if (width <= 100) width = 100
        if (width >= 500) width = 500
        g_cache.itemWidth = width
        g_pp.setTimeout('itemWidth', () => setConfig('itemWidth', width), 50)
    },
    init() {
        const self = this
        $(`<button tabindex="-1" class="btn btn-sm dropdown-toggle" data-target-dropdown="datalist_opts" data-dropdown-pos="start-bottom" >
            <i class="me-1 ti ti-layout-2"></i>
        </button>`).appendTo('#datalist_actions')

        g_dropdown.register('datalist_opts', {
            position: 'start-bottom',
            offsetTop: 5,
            list: {
                showmation: {
                    title: '信息',
                    icon: '',
                },
                view: {
                    title: '视图',
                    icon: '',
                },
                sort: {
                    title: '排序',
                    icon: '',
                },
                refresh: {
                    title: '刷新',
                    icon: '',
                    action: '',
                }
            }
        })

        // TODO 注册自定义排序以及视图
        g_dropdown.register('showmation', {
            position: 'end-top',
            offsetLeft: 10,
            alwaysHide: true,
            parent: ['datalist_opts', 'showmation'],
            list: {
                name: {
                    title: '名称',
                    action: 'show,name',
                },
                desc: {
                    title: '注释',
                    action: 'show,desc',
                },
                duration: {
                    title: '时长',
                    action: 'show,duration',
                },
                ext: {
                    title: '格式',
                    action: 'show,ext',
                },
            }
        }).init()

        g_dropdown.register('datalist_view', {
            position: 'end-top',
            offsetLeft: 10,
            alwaysHide: true,
            parent: ['datalist_opts', 'view'],
            list: {
                // TODO 不同视图有不同的展示选项
                default: {
                    title: '卡片视图',
                    icon: '',
                    action: 'view,default',
                },
                table: {
                    title: '表格视图',
                    icon: '',
                    action: 'view,table',
                },
            }
        }).init()

        g_dropdown.register('datalist_sort', {
            position: 'end-top',
            offsetLeft: 10,
            alwaysHide: true,
            parent: ['datalist_opts', 'sort'],
            list: {
                asc: {
                    title: '反序',
                    action: 'reverse_toggle',
                },
                name: {
                    title: '名称',
                    action: 'sort,name',
                },
                date: {
                    title: '创建日期',
                    action: 'sort,date',
                },
                score: {
                    title: '评分',
                    action: 'sort,score',
                },
                // duration: {
                //     title: '时长',
                //     action: 'sort,duration',
                // },
                // px: {
                //     title: '像素',
                //     action: 'sort,px',
                // },
                // size: {
                //     title: '尺寸',
                //     action: 'sort,size',
                // },
            }
        }).init()

        g_action.
        registerAction({
            range_view: dom => {
                self.item_setWidth(dom.value)
            },
            setItemWidth: (dom, action, e) => {
                let width = g_cache.itemWidth || parseInt(getConfig('itemWidth', 200))
                if (e.ctrlKey) {
                    width += e.deltaY < 0 ? 20 : -20
                    self.item_setWidth(width)
                }
            },
            sort: (dom, action) => { // 排序
                g_datalist.sort_switch(action[1])
            },
            view: (dom, action) => { // 视图
                g_datalist.view_switch(action[1])
            },
            show: (dom, action) => {
                g_setting.toggleValue(action.join(','))
                g_datalist.view_update()
            },
            // 切换倒序
            reverse_toggle() {
                g_setting.toggleValue('sort_reverse')
                g_dropdown.hide('datalist_sort')
                g_datalist.tab_refresh()
            }
        })

        let keys = replaceArr(['%name', '%desc', '%duration', '%ext'], 'show,')
        g_setting.
        onSetConfig(keys, (v, k) => {
            getEle(k).toggleClass('active', v)
        }).
        onSetConfig({
            itemWidth(v) {
                $('.datalist-item').width(v)
                getEle({ input: 'range_view' }).val(v)
            },
            sort_reverse(v){
                getEle('reverse_toggle').toggleClass('active', v)
            }
        })
        g_setting.apply(keys).apply('sort_reverse')
    }
}

g_view.init()