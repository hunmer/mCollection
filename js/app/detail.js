var g_detail = {
    selected_keys: [],
    init() {
        const self = this

        this.columns = {
            preview: {
                html: d => `
                  <img data-action="detail_image" src="${g_item.item_getVal('cover', d)}" alt="${d.title}" class="rounded p-1">
            `
            },
            colors: {
                html: d => {
                    let h = ''
                    let max = 9;
                    (d.json.colors || []).forEach((color, i) => {
                        if (i < max) {
                            h += `
                              <div class="color flex-fill" style="background-color: ${color}" title="${color}"></div>
                            `
                        }
                    })
                    return `<div class="d-flex w-full" style="height: 30px">${h}</div>`
                }
            },
            name: {
                html: d => `
                    <div class="input-group input-group-sm mb-3">
                      <span class="input-group-text" id="inputGroup-sizing-sm">名称</span>
                      <input data-input="detailText,title" data-change="detailText,title" type="text" class="form-control form-control-flush border-hover" placeholder="..." value="${d.title || ''}">
                    </div>
                `
            },
            tags: {
                html: d => {
                    let h = ''
                    d.tags.forEach(tag => {
                        h += `
                            <a href='#' class="badge m-1">
                                <i class="ti ti-tag me-1"></i>
                                <span data-action="tag_edit">${tag}</span>
                            </a>
                        `
                    })
                    return `
                    <div class="card border-0 shadow-none bg-transparent w-full">
                          <div class="card-body shadow-none p-1 border-hover cursor-text bg-none" data-action="detail_tags">
                            ${h || '<span class="badge badge-secondary">设置标签</span>'}
                          </div>
                        </div>
                    `
                }
            },
            textarea: {
                html: d => `
                    <div class="input-group input-group-sm mb-3">
                      <span class="input-group-text" id="inputGroup-sizing-sm">注释</span>
                      <textarea data-input="detailText,desc" data-change="detailText,desc" class="form-control form-control-flush border-hover" placeholder="..." rows="3" >${d.desc || ''}</textarea>
                    </div>
                `
            },
            link: {
                html: d => `
                    <div class="input-group input-group-sm mb-3">
                      <span class="input-group-text" id="inputGroup-sizing-sm" data-action="detail_link">
                        <i class="ti ti-link"></i>
                      </span>
                      <input type="text" data-input="detailText,link" data-change="detailText,link" placeholder="https://" class="form-control form-control-flush border-hover"  value="${d.link || ''}">
                    </div>
                `
            },
            folders: {
                html: d => {
                    let h = ''
                    toArr(d.folders).forEach(folder => {
                        h += `
                            <a href='#' class="badge badge-pill m-1">
                                <i class="ti ti-folder me-1"></i>
                                <span data-action="">${g_folder.folder_getName(folder)}</span>
                            </a>
                        `
                    })
                    return `
                        <div class="card border-0 shadow-none bg-transparent w-full">
                          <div class="card-body shadow-none p-1 border-hover cursor-text bg-none" data-action="detail_folders">
                            ${h || '<span class="badge badge-secondary">设置文件夹</span>'}
                          </div>
                        </div>
                    `
                }
            },
            status: {
                html: d => `
                    <div class="rows align-items-center mt-2 w-full align-self-end">
                        <div class="d-flex p-1">
                            <span class="badge bg-blue-lt">评分</span>
                            <div class="flex-fill text-end">${d.score}</div>
                        </div>
                       <div class="d-flex p-1">
                            <span class="badge bg-indigo-lt">大小</span>
                            <div class="flex-fill text-end">${renderSize(d.size)}</div>
                        </div>
                        <div class="d-flex p-1">
                            <span class="badge bg-pink-lt">格式</span>
                            <div class="flex-fill text-end">${d.json.format}</div>
                        </div>
                        <div class="d-flex p-1">
                            <span class="badge bg-lime-lt">扩展名</span>
                            <div class="flex-fill text-end">${popString(g_item.item_getVal('file', d), '.')}</div>
                        </div>
                        <div class="d-flex p-1">
                            <span class="badge bg-orange-lt">视频大小</span>
                            <div class="flex-fill text-end">${d.json.width+'x'+d.json.height}</div>
                        </div>
                    </div>
                `
            },
        }

        g_sidebar.register('right', {
            html: `
                 <div id="detail" class="p-2 d-flex flex-wrap align-content-around" style="min-height: 60vh">
                </div>
            `,
            style: `
                #sidebar_right {
                    right: 0;
                    width: 200px;
                    top: var(--offset-top);
                    margin-right: 0px;
                }

                #sidebar_right.hideSidebar {
                    margin-right: -200px;
                }

                main[sidebar-right]{
                    padding-right: 200px;
                }
            `,
        })
        $('#sidebar_right').addClass('border-start')

        let timer
        g_action.registerAction({
            detailText: (dom, action) => {
                clearTimeout(self.timer)
                self.timer = setTimeout(() => self.saveChanges(), 2000)
            },
            detail_folders: (dom, action, e) => {
                if (e.target.classList.contains('card-body')) { // 点最外围
                    self.edit('folders', {
                        onSelectedList(name) {
                            if (name == 'group') name = 'folders_folder'
                            // g_filter.setOpts('filter.folder.type', name)
                            return g_folder.folder_sort(name)
                        }
                    }, changes => {
                        changes.added.forEach((add, i) => {
                            if(!g_folder.folder_exists(add)){ // 检测是否有新文件夹
                                let fid = guid()
                                g_folder.folder_set(fid, {title: add})
                                if(changes.newst.includes(add)){ // 是新目录
                                    changes.added[i] = fid // 把目录名改成folderID
                                } 
                            }
                        })
                        
                        this.selected_keys.forEach(md5 => g_folder.item_toggleFolders(md5, changes.added, changes.removed))
                        self.update()
                    }).show(dom, 'start,top')
                    clearEventBubble(e)
                    // 那多个怎么显示?
                    // 同时展示选中的标签，确定后删除被取消的标签，添加新增的标签
                    // 获取显示所有标签，然后选择一个标签，再自动选择匹配的md5??
                }
            },
            detail_tags: (dom, action, e) => {
                if (e.target.classList.contains('card-body')) { // 点最外围
                    self.edit('tags', {
                        onSelectedList(name) {
                            if (name == 'group') name = 'tag_folder'
                            // g_filter.setOpts('filter.tag.type', name)
                            return g_tags.tag_sort(name)
                        }
                    }, changes => {
                        this.selected_keys.forEach(md5 => g_tags.item_toggleTags(md5, changes.added, changes.removed))
                        self.update()
                    }).show(dom, 'start,top')
                    clearEventBubble(e)
                }
            },
        })

    },

    // 保存文本更改
    saveChanges() {
        if (this.timer) {
            clearTimeout(self.timer)
            delete this.timer
            this.selected_keys.forEach(md5 => {
                let data = g_data.data_get(md5)
                g_data.data_setData(Object.assign(data, {
                    title: getEle({ input: 'detailText,title' }).val(),
                    desc: getEle({ input: 'detailText,desc' }).val(),
                    link: getEle({ input: 'detailText,link' }).val(),
                }))
            })
            // TODO 更新datalist信息
        }
    },

    save() {
        // this.item.name = 
    },

    // 弹出编辑框
    edit(type, opts, callback) {
        let obj
        let id = type + '_list'
        return new _DropDown(id, {
            width: '350px',
            html: '<div id="' + id + '" class="p-2"></div>',
            onShown: () => {
                let keys = new Set()
                // forEach实质是callback,所以不会等待async执行结束
                this.selected_keys.forEach(async (md5, i) => {
                    let data = await g_data.data_get(md5)
                    if (data[type]) {
                        data[type].forEach(v => keys.add(v)) // TODO 检测目录是否存在，不存在则创建
                    }
                    if (i == this.selected_keys.length - 1) { // 判断是否最后一个
                        obj = g_groupList.selector_build(id, {
                            container: '#' + id,
                            defaultList: 'sz',
                            selected: Array.from(keys),
                            onSelectedList: name => opts.onSelectedList(name),
                            getName: name => type == 'folders' ? g_folder.folder_getName(name) : name,
                        })
                        obj.show()
                    }
                })
            },
            onHide: () => {
                callback(obj.getChanges())
            }
        })
    },

    // 单个项目列表
    getHTML(d) {
        let h = ''
        this.data = Object.assign({
            // link: '',
            // desc: '',
            // json: {
            //     colors: ['#206bc4', '#d6336c', '#17a2b8', '#f76707', '#4299e1', '#206bc4'],
            //     duraction: 30,
            //     format: 'mp4',
            //     width: 300,
            //     height: 200,
            // },
            // birthtime: new Date().getTime(),
            // size: 221321,
            // folders: ['文件夹1'],
            // score: 4,
        }, d)
        for (let [name, column] of Object.entries(this.columns)) {
            h += `<div id="detail_columns_${name}" class="w-full">` + column.html(this.data) + '</div>'
        }
        return h
    },

    // 返回信息元素
    getColumnContent(name) {
        return $('#detail_columns_' + name)
    },

    // 更新指定信息
    async updateColumns(list) {
        let md5 = this.selected_keys[0]
        if (typeof(md5) != 'undefined') {
            let data = copyObj(await g_data.data_get(md5))
            toArr(list).forEach(name => {
                this.getColumnContent(name).replaceWith(this.columns[name].html(data))
            })
        }
    },

    // 展示列表
    async showList(list) {
        this.saveChanges() // 保存上一次的更改

        this.selected_keys = list
        let i = list.length
        let h = ''
        if (i == 0) { // 没有选中
            h = `

            `
        } else
        if (i > 1) {
            // 详情显示选中列表
            let h1 = ''
            let size = 0,
                duration = 0,
                tags = new Set()

            list.forEach(async (md5) => {
                let d = await g_data.data_get(md5)
                size += parseInt(getObjVal(d, 'stat.size', 0))
                duration += parseInt(getObjVal(d, 'stat.duration', 0))
                d.tags.forEach(tag => tags.add(tag))

                h1 += g_datalist.item_parse(d, `
                    <div class="datalist-item col-12" data-action="item_unselected" {md5}>
                    <div class="card card-sm h-full">
                      <a class="d-block">
                        <img src="{cover}" class="card-img-top thumb" {dargable} {preview}>
                      </a>
                      <div class="card-body">
                          <div class="d-flex align-items-center">
                            <div>
                                <div>${d.title}</div>
                            </div>
                           </div>
                      </div>
                    </div>
                </div>`)
            })
            h += `
            <div class="mb-3">
                <span class="badge bg-danger me-2" onclick="g_detail.edit_tag()">${tags.size}个标签</span>
                <span class="badge bg-danger me-2">${i}个项目</span>
                <span class="badge bg-warning me-2">${renderSize(size)}</span>
                ${duration ? `<span class="badge bg-info me-2">${getTime(duration)}</span>` : ''}
            </div>
            <div class="row w-full mb-3">
                ${h1}
            </div>
            <div class="text-center w-full">
                <button class="btn btn-primary" data-action="item_selected_clear">取消所有</button>
            </div>

            `
            h += '</div>'
        } else {
            // 显示详情
            let d = copyObj(await g_data.data_get(list[0]))
            // 检查色卡是否存在
            if (!d.json.colors || !d.json.colors.length) {
                g_item.item_setCover(list[0], g_item.item_getVal('cover', d))
            }
            h = g_detail.getHTML(d)
        }
        $('#detail').html(h)
    },

    update: function() {
        this.showList(this.selected_keys)
    },
}

g_detail.init()