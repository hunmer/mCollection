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
                    if (!d.json.colors) return ''
                    let h = ''
                    d.json.colors.slice(0, 9).forEach(color => {
                        color = color.join(',')
                        h += `
                              <div class="color flex-fill" data-action="color_match" style="background-color: rgb(${color})" title="${color}"></div>
                            `
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
                multi: true,
                html: d => {
                    let h = ''
                    d.tags.forEach(tag => {
                        h += `
                            <a href='#' class="badge m-1" data-action="showTag" data-tag="${tag}">
                                <i class="ti ti-tag me-1"></i>
                                <span>${tag}</span>
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
                multi: true,
                html: d => `
                    <div class="input-group input-group-sm mb-3">
                      <span class="input-group-text" id="inputGroup-sizing-sm">注释</span>
                      <textarea data-input="detailText,desc" data-change="detailText,desc" class="form-control form-control-flush border-hover" placeholder="..." rows="3" >${d.desc || ''}</textarea>
                    </div>
                `
            },
            link: {
                multi: true,
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
                multi: true,
                html: d => {
                    let h = ''
                    toArr(d.folders).forEach(folder => {
                        h += `
                            <a href='#' class="badge badge-pill m-1" data-action="showFolder" data-folder="${folder}">
                                <i class="ti ti-folder me-1"></i>
                                <span>${g_folder.folder_getName(folder)}</span>
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
                multi: true,
                // TODO 是否显示判断
                html: d => {
                    let h = ''
                    let list = {
                        uploader: {
                            title: '上传者',
                            class: 'bg-pink-lt',
                            getVal: () => d.json.uploader
                        },
                        score: {
                            title: '评分',
                            class: 'bg-blue-lt',
                        },
                        size: {
                            title: '大小',
                            class: 'bg-indigo-lt',
                            getVal: () => renderSize(d.size)
                        },
                        ext: {
                            title: '扩展名',
                            class: 'bg-lime-lt',
                            getVal: () => {
                                if (d.md5) {
                                    return popString(g_item.item_getVal('file', d), '.')
                                }
                            }
                        },
                        px: {
                            title: '视频大小',
                            class: 'bg-orange-lt',
                            getVal: () => {
                                let { width, height } = d.json
                                if (width && height) {
                                    return width + 'x' + height
                                }
                            }
                        },
                    }
                    for (let [k, v] of Object.entries(list)) {
                        let val = v.getVal ? v.getVal() : d[k]
                        if (isEmpty(val) || val === false) continue
                        h += `
                            <div class="d-flex p-1">
                                <span class="badge ${v.class}">${v.title}</span>
                                <div class="flex-fill text-end">${val}</div>
                            </div>
                        `
                    }
                    return `
                    <div class="rows align-items-center mt-2 w-full align-self-end">
                        ${h}
                    </div>`
                }

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
            // 颜色相似过滤器
            color_match(dom) {
                colorTest(dom.title.split(',')).then(items => {
                    g_datalist.tab_clearItems()
                    g_datalist.tab_setItems(items)
                })
            },
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
                            if (!g_folder.folder_exists(add)) { // 检测是否有新文件夹
                                let fid = guid()
                                g_folder.folder_set(fid, { title: add })
                                if (changes.newst.includes(add)) { // 是新目录
                                    changes.added[i] = fid // 把目录名改成folderID
                                }
                            }
                        })
                        this.selected_keys.forEach(md5 => g_folder.item_toggleFolders(md5, changes.added, changes.removed))
                        self.update()
                    }).show(dom, 'start-top')
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
                    }).show(dom, 'start-top')
                    clearEventBubble(e)
                }
            },
        })

    },

    assignObj(d) {
        return Object.assign({
            tags: [],
            folders: [],
            json: '{}',
            date: 0,
            birthtime: 0,
            size: 0,
            score: 0,
            desc: '',
            link: '',
            ext: '',
            title: '',
        }, d)
    },

    // 保存文本更改
    saveChanges() {
        if (this.timer) {
            clearTimeout(self.timer)
            delete this.timer
            this.selected_keys.forEach(async md5 => {
                let data = await g_data.data_get(md5)
                g_data.data_set(md5, {
                    title: getEle({ input: 'detailText,title' }).val(),
                    desc: getEle({ input: 'detailText,desc' }).val(),
                    link: getEle({ input: 'detailText,link' }).val(),
                })
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
                Promise.all(this.selected_keys.map(async md5 => {
                    let data = await g_data.data_get(md5)
                    if (data[type]) {
                        data[type].forEach(v => keys.add(v)) // TODO 检测目录是否存在，不存在则创建
                    }
                })).then(() => {
                    obj = g_groupList.selector_build(id, {
                        container: '#' + id,
                        defaultList: 'sz',
                        selected: Array.from(keys),
                        onSelectedList: name => opts.onSelectedList(name),
                        getHeader: name => type == 'folders' ? g_folder.folder_getName(name) : name,
                        getName: name => type == 'folders' ? g_folder.folder_getName(name) : name,
                    })
                    obj.show()
                })
            },
            onHide: () => {
                callback(obj.getChanges())
            }
        })
    },

    // 单个项目列表
    getHTML(d, multi = false) {
        let h = ''
        d = this.assignObj(d)
        for (let [name, column] of Object.entries(this.columns)) {
            if (multi && !column.multi) continue
            h += `<div id="detail_columns_${name}" class="w-full">` + column.html(d) + '</div>'
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
        if (i > 1) {
            let size = 0,
                duration = 0,
                tags = new Set()
            Promise.all(list.map(async (md5) => {
                let d = await g_data.data_get(md5)
                size += d.size
                duration += parseInt(getObjVal(d, 'json.duration', 0))
                d.tags.forEach(tag => tags.add(tag))
            })).then(() => {
                $('#detail').html(g_detail.getHTML({
                    size,
                    duration
                }, true))
            })
        } else {
            // 显示详情
            let d = copyObj(await g_data.data_get(list[0]))

            // 检查色卡是否存在
            if (!d.json.colors || !d.json.colors.length) {
                g_item.item_setCover(list[0], g_item.item_getVal('cover', d))
            }
            $('#detail').html(g_detail.getHTML(d))
        }
    },

    update: function() {
        this.showList(this.selected_keys)
    },
}

g_detail.init()

function colorTest(rgb, max = 50) {
    // TODO 颜色排序选项
    return new Promise(reslove => {
        g_data.all('SELECT json,md5 FROM videos WHERE deleted=0').then(items => {
            let r = []
            items.forEach(({ md5, json }) => {
                json = JSON.parse(json)
                if (json.colors) {
                    let val = deltaE(json.colors[0], rgb)
                    if (val <= max) r.push({ md5, val })
                }
            })
            reslove(r.sort((a, b) => a.val - b.val)) // 比较的是颜色的不相似度？
        })
    })

}