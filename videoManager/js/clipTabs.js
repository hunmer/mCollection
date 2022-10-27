var g_clipTabs = {
    init() {
        const self = this

        this.tabs = g_tabs.register('clip_tabs', {
            target: '#clip_tabs',
            saveData: false,
            parseContent: (k, v) => {
                return `
                    <div class="datalist h-full pb-4">
                        <div class="row row-cards datalist-items"></div>
                   </div>
                `
            },
            // parseTab: (k, v) => v.title,
            onShow: (tab, old) => {
                console.log(tab)
                for (let [id, { opts, inst }] of Object.entries(self.instance)) {
                    opts.onTabChanged(tab)
                }
            },
            onHide: tab => {

            },
            onClose: tab => {

            },
            items: {
                tags: {
                    id: 'tags',
                    title: '<i class="ti ti-tags fs-2"></i>',
                    html: `
                        <div class="row h-full">
                            <div class="col-3 border-end">
                               <div class="input-icon">
                                  <input type="text" value="" class="form-control form-control-sm form-control-rounded" placeholder="Search…">
                                  <span class="input-icon-addon">
                                    <i class="ti ti-search"></i>
                                  </span>
                                </div>
                                <div class="mt-2">
                                  <label class="form-label">标签组</label>
                                  <div class="form-selectgroup form-selectgroup-boxes d-flex flex-column">
                                    <label class="form-selectgroup-item flex-fill">
                                      <input type="radio" name="form-payment" value="folder1" class="form-selectgroup-input">
                                      <div class="form-selectgroup-label d-flex align-items-center p-1">
                                        <div class="me-3">
                                          <span class="form-selectgroup-check"></span>
                                        </div>
                                        <div class="flex-fill">
                                          标签组1
                                        </div>
                                        <div>
                                          <span class="badge bg-primary ">30</span> 
                                        </div>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                                <ul>
                            </div>
                            <div class="col">

                                <div class="mb-1">
                                    <button type="button" class="btn bg-primary">Tag1</button>
                                    <button type="button" class="btn bg-primary">Tag2</button>
                                </div>

                                <div class="d-flex flex-row-reverse">
                                    <button class="btn">
                                        <i class="ti ti-filter"></i>
                                    </button>
                                </div>

                                <div class="mb-3">
                                    <div class="border-bottom mb-1">
                                        <h3>A<span class="badge bg-primary ms-2">4</span></h3>
                                    </div>
                                    <div>
                                        <button type="button" class="btn">
                                         Tag1
                                        </button>
                                         <button type="button" class="btn">
                                         Tag2
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="border-bottom mb-1">
                                        <h3>B<span class="badge bg-primary ms-2">4</span></h3>
                                    </div>
                                    <div>
                                        <button type="button" class="btn">
                                         Tag1
                                        </button>
                                         <button type="button" class="btn">
                                         Tag2
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    `,
                }
            }
        })
        this.tabs.tab_ative('tags')
        loadRes(['js/clipTabs/cut.js'])
    },

    // videoTab事件
    videoTabEvent(event, ...args) {
        // 传递给组件
        for (let [id, { opts, inst }] of Object.entries(this.instance)) {
            opts.onVideoEvent(event, args)
        }
    },

    instance: {},
    register(id, opts, inst) {
        this.tabs.add(opts.tab, id)
        this.instance[id] = { opts, inst }
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

g_clipTabs.init()