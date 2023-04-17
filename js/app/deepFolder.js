module.exports = function (_opts) {
    var _icon = _opts.icon
    var _type = _opts.type
    var _table = _type + '_meta'
    var _inst = require('./db_deepFolder.js')(new basedata({
        name: _type,
        primarykey: 'id',
        icon: _icon,
        defaultList: _opts.defaultList,
        insertDefault(id) {
            return {
                id,
                title: _opts.defaultTitle,
                parent: '',
                icon: _icon,
                meta: {},
                ctime: new Date().getTime()
            }
        },
        update() {
            g_category.category_set(_type, {
                action: 'category_' + _type,
                list: this.folder_getChildren('', true)
            })
            $(`[data-list="${_type}"]`).prop('draggable', true)
        },

        init() {
            const self = this
            g_sort.set(_type + '_py', id => PinYinTranslate.sz(self.folder_getValue(id, 'title', '0').substr(0, 1)))
            g_sort.set(_type + '_group', id => self.folder_getValue(self.folder_getParent(id), 'title', '未分组'))

            let actions = ['edit', 'delete', 'new', 'newSub', 'clear'].map(k => _type + '_' + k)
            g_action.
                registerAction(actions, (dom, action) => {
                    let id = self.menu_key
                    g_dropdown.hide('actions_' + _type)
                    g_menu.hideMenu(_type + '_item')
                    switch (actions.indexOf(action[0])) {
                        case 4:
                            self.reset()
                            break;
                        case 3:
                            return self.folder_edit(-1, id)
                        case 0:
                        case 2:
                            return self.folder_edit(id || -1)
                        case 1:
                            // TODO 删除目录时更多选项(删除所有视频)
                            return confirm('确定要删除目录【' + self.folder_getValue(id, 'title') + '】吗？\n删除后素材不会消失', {
                                title: '删除目录',
                                type: 'danger'
                            }).then(() => self.folder_remove(id))
                    }
                    delete self.menu_key
                }).
                registerAction('detail_' + _type, (dom, action, e) => {
                    if (e.target.classList.contains('card-body')) { // 点最外围
                        self.showPrompt(obj => {
                            let selected = obj.getSelected()
                            let ids = g_data.arr_join(
                                selected.map((id, k) => {
                                    if (obj.newst.includes(id)) { // 新目录
                                        id = self.folder_add(id)
                                    }
                                    return id
                                })
                            )
                            Promise.all(g_detail.selected_keys.map(md5 => self.setItemFolder(md5, ids))).then(() => g_detail.updateColumns(_type)) // 放在setItemFolder会更好？
                        }).show(dom, 'start-top')
                        clearEventBubble(e)
                    }
                })

            g_plugin.registerEvent('onBeforeShowingDetail', ({ columns }) => {
                    columns[_type] = {
                        multi: true,
                        async html(items) {
                            let h = '';
                            let list = await Promise.all(items.map(item => self.getItemFolder(item.id)))
                            uniqueArr(flattenArray(list)).forEach(folder => {
                                h += `
                                    <a href='#' class="badge badge-pill m-1" data-action="showFolder_${_type}" data-folder="${folder}">
                                        <i class="ti ti-${_icon} me-1"></i>
                                        <span>${self.folder_getValue(folder, 'title')}</span>
                                    </a>
                                `
                            })
                            return `
                            <div class="card border-0 shadow-none bg-transparent w-full mb-1">
                              <div class="card-body d-flex flex-wrap align-items-center ps-0 shadow-none p-1 border-hover cursor-text bg-none" data-action="detail_${_type}">
                                <span class="badge badge-secondary">${_opts.detailPlaceholder}</span> ${h}
                              </div>
                            </div>
                        `
                        }
                    }
            })
        },

        showPrompt(callback) {
            var obj
            let id = _type + '_list'
            return new _DropDown(id, {
                width: '350px',
                html: `<div id="${id}" class="p-2"></div>`,
                onShown: async () => {
                    let list = await Promise.all(g_detail.selected_keys.map(async md5 => {
                        let fid = await g_data.data_getID(md5)
                        return this.getItemFolder(fid)
                    }))
                    obj = this.buildSelector(id, {
                        selected: Array.from(new Set(list.flat())),
                        container: '#' + id,
                    })
                    obj.show()
                },
                onHide: () => callback(obj)
            })
        },

        buildSelector(id, opts) {
            if (!opts.sorts) opts.sorts = {}
            let sorts = opts.sorts
            if (sorts[_type + '_py'] == undefined) sorts[_type + '_py'] = { title: '拼音', icon: 'inbox' }
            if (sorts[_type + '_group'] == undefined) sorts[_type + '_group'] = { title: '群组', icon: 'folder' }
            return g_groupList.selector_build(id, Object.assign({
                defaultList: _type + '_py',
                onSelectedList: name => this.folder_sort(name),
                getName: fid => this.folder_getValue(fid, 'title', ''),
            }, opts))
        },

        showFolder(name) {
            // TODO 把这个方法写到category
            let h = ''
            let datas = Object.entries(this.folder_getChildren(name, true)).map(function([k, v]){
                return {
                    html: g_category.item_html(k, _type, v, 'category_' + _type),
                    group: name
                }
            })

            if (datas.length) {
                let id = `category_${_type}_${name}`
                let div = $("#accordion-" + id)
                if (div.length){
                    div.remove(); // 隐藏
                } else{
                    let accordion = g_tabler.build_accordion({
                        id,
                        datas,
                        default: true,
                        parent: false,
                        header: '<span class="badge bg-primary">{i}个目录</span>',
                        onOpen: () => { },
                        collapse_start: `<div class="list-group list-group-flush">`,
                        collapse_end: `</div>`,
                    })
                    accordion.find(`[data-list="${_type}"]`).prop('draggable', true)
                    getEle({ action: 'category_' + _type, list: _type, name }).parent('.row').append(accordion)
                }
                return
            }

            let tab = g_rule.getTabParams(_type, {ids: [name]})
            let item = _inst.get(name)
            tab.icon = item.icon || _icon
            tab.title = item.title
            g_datalist.tab_new(tab)
        },
    }))

    g_rule.register(_type, {
        title: _type,
        sqlite(data) {
            return {
                method: 'select',
                search: 'id,md5',
                table: 'files',
                args: {
                    [_type]: `JOIN ${_table} ON files.id = ${_table}.fid`
                },
                where: {
                    [_type]: `${_table}.ids like '%${g_data.arr_join(data.ids)}%'`
                }
            }
        },
        sidebar: _opts.sidebar,
        update: false,
    })

    g_action.registerAction({
        [`category_${_type}`]: dom => _inst.showFolder(dom.dataset.name),
        [`showFolder_${_type}`]: dom => _inst.showFolder(dom.dataset.folder)
    })

    g_category.
        registerAction(_type, (dom, action) => {
            _inst.menu_key = action[2] // TODO 设置dropdown的key
            g_dropdown.show('actions_' + _type, dom)
        })

    g_dropdown.register('actions_' + _type, {
        position: 'top-end',
        offsetLeft: 5,
        list: {
            edit: {
                title: '编辑',
                icon: 'pencil',
                action: _type + '_edit',
            },
            create: {
                title: '新建子目录',
                icon: 'plus',
                action: _type + '_newSub',
            },
            delete: {
                title: '删除',
                icon: 'trash',
                class: 'text-danger',
                action: _type + '_delete',
            },
        }
    })

    g_menu.registerMenu({
        name: _type + '_item',
        selector: `[data-collapse="${_type}"]`,
        dataKey: 'data-name',
        html: g_menu.buildItems([{
            icon: 'plus',
            text: '新建',
            action: _type + '_new'
        }, {
            icon: 'trash',
            text: '清空',
            class: 'text-danger',
            action: _type + '_clear'
        }])
    });

    g_drag.register(_type, {
        selector: `[data-list="${_type}"]`,
        target: `[data-list="${_type}"]`,
        html: `<span class="badge bg-primary position-absolute" id="badge_darging_${_type}"></span>`,
        onDragStart: e => e.dataTransfer.setData(_type, e.target.dataset.name),
        onUpdateTarget: e => {
            let { list, name } = e.target.dataset
            // 显示badge信息
            // getElement(name)
            let badge = $('#badge_darging_' + _type).show()
            badge.css({
                left: e.clientX + 20,
                top: e.clientY + 20,
            })
            if (list == _type) {
                badge.html('移动到文件夹: ' + name)
            }
        },
        onDrop: e => {
            g_drag.hide(_type)
            let files = (e.target.files || e.dataTransfer.files)
            let from = e.dataTransfer.getData(_type)
            let { list, name } = e.target.dataset
            if (list == _type && name != from) {
                if (!isEmpty(from)) { // 目录之间的层级移动
                    // TODO 设置为目标的子目录或者同级目录
                    // 设置父目录
                    return _inst.folder_setValue(from, 'parent', name)
                }
                if (files.length) { // 文件接收
                    if (arr_equal(g_cache.dragingFile, Object.values(files).map(v => v.path))) { // 从软件拖拽的文件
                        // 更改目录
                        let i = 0
                        g_cache.dragingMD5s.forEach(md5 => {
                            // 是不是直接移动到文件夹要设置一个目录？？
                            if (_inst.item_setFolders(md5, name, true)) {
                                i++
                            }
                        })
                        return toast('成功设置 ' + i + ' 个文件的目录');
                    }
                }
            }
        }
    })
    return _inst
}