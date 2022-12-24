var g_detailTabs = {
    init() {
        const self = this

        this.tabs = g_tabs.register('detail_tabs', {
            target: '#detail_tabs',
            menu: ' ',
            saveData: false,
            getTabIndex(tab){
                return self.instance[tab].opts.index
            },
            parseContent (k, v){
                return `
                    <div class="datalist h-full pb-4">
                        <div class="row row-cards datalist-items"></div>
                   </div>
                `
            },
            // parseTab: (k, v) => v.title,
            onShow (tab, e) {
                self.instance[tab]  && self.instance[tab].opts.onTabChanged(tab, e)
            },
            onHide(tab){},
            onClose(tab) {},
            items: {}
        })

        // 'js/detailTabs/cut.js',, 'js/detailTabs/rule.js', 
        loadRes([  'js/detailTabs/clips.js', 'js/detailTabs/meta.js', 'js/detailTabs/playlist.js', 'js/detailTabs/cupfox.js', 'js/detailTabs/coll.js', 'js/detailTabs/downlist.js'], () => {
          // 
            // let timer =  setTimeout(() => {
            //      g_modal.remove('alert_loadLast')
            // }, 1500)
            // alert(`<h3 class="text-center">正在恢复上次的状态<span class="animated-dots"></span></h3>`, {
            //     id: 'alert_loadLast',
            //     title: '请稍等...',
            //     btn_ok: '取消'
            // }).then(() => {
            //     clearTimeout(timer)
            // })
        })
    },

    // videoTab事件
    videoTabEvent(event, args) {
        // 传递给组件
        g_plugin.callEvent('videoTabEvent', {event, args}).then(({event, args}) => {
            for (let [id, { opts, inst }] of Object.entries(this.instance)) {
                 opts.onVideoEvent && opts.onVideoEvent(event, args)
            }
        })
        // if(event == 'show'){
        //     g_detailTabs.tabs.tab_ative('clips') // 默认展示裁剪列表
        // }
    },

    instance: {},
    register(id, opts, inst) {
        this.instance[id] = { opts, inst }
        this.tabs.add(opts.tab, id, false)
        inst.init && inst.init()
    },

    // 新建视窗
    tab_new(data) {
        // getConfig('oneTab') && this.tabs.clear()
        this.tabs.try_add(function(v) { // 不重复打开
            return v[1].data.id == data.id
        }, {
            title: data.title,
            data: {
                file: data.file
            },
        })
    },

}

g_detailTabs.init()