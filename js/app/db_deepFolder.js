module.exports = function(self) {
    var _type = self.name
    var _icon = self.icon
    var _table = _type + '_meta'
    self = Object.assign(self, {
        event: {
            set: ({ vals }) => self.data_set(vals.id, vals),
            remove: ({ vals }) => self.data_remove(vals.id),
            reset: () => self.refresh('reset')
        },
        data_set(id, data) {
            data.meta = JSON.stringify(data.meta)
            return g_data.data_set2({
                table: _type,
                key: 'id',
                value: id,
                data,
            }).then(ret => ret.changes > 0 && self.refresh('data_set'))
        },
        data_remove(id) {
            return g_data.data_remove2({
                table: _type,
                key: 'id',
                value: id,
            }).then(ret => ret.changes > 0 && self.refresh('data_remove'))
        },
        removeItemFolder(fid) {
            return g_data.data_remove2({ table: _table, key: 'fid', value: fid })
        },
        async setItemFolder(fid, ids) {
            if (Array.isArray(ids)) ids = g_data.arr_join(ids)
            fid = await g_data.data_getID(fid)
            // 如果ids为空则删除...
            return g_data.data_set2({ table: _table, key: 'fid', value: fid, data: { fid, ids } })
        },
        async getItemFolder(d) {
            let ids = obj_From_key(await g_data.getMetaInfo(d, _type), 'ids').ids
            return typeof(ids) == 'string' ? g_data.arr_split(ids).map(id => parseInt(id)) : toArr(ids)
        },
        inited: false,
        async getList() {
            let list = await g_data.all('SELECT * FROM ' + _type)
            // return [...this.defaultList, ...list]
            return list
        },
        folder_toIds(list) {
            return toArr(list).map((id, i) => {
                if (typeof(id) == 'number' && this.exists(id)) {
                    return id
                }
                let title = id
                let fid = this.folder_getIdByTitle(title)
                if (fid == -1) fid = this.folder_add({ title })
                return fid
            })
        },
        refresh(source) {
            if (isEmpty(source)) return
            self.getList().then(list => {
                self.list = list
                if (!self.inited) {
                    self.inited = true
                    // 保证默认列表存在数据库内
                    self.defaultList.forEach(item => this.set(item.id, item, false))
                }
                self.update()
            })
        },

        folder_getValue(id, key, defV) {
            let item = this.get(id) || {}
            return item[key] || defV
        },

        // 添加目录
        folder_add(vals) {
            if (typeof(vals) != 'object') {
                vals = {
                    title: vals
                }
            }
            if (isEmpty(vals.title))
                return

            let id = this.folder_getIdByTitle(vals.title)
            if (id != -1) {
                // TODO 询问
                return
            }
            id = this.getNextId()
            this.set(id, vals)
            return id
        },

        folder_getIdByTitle(title) {
            let id = this.search('title', title)
            return id != undefined ? parseInt(id) : -1
        },

        // 获取父目录
        folder_getParent(id) {
            return (this.get(id) || {
                parent: ''
            }).parent
        },

        // 获取所有父目录
        folder_getParents(id) {
            let r = []
            const next = pid => this.folder_getParent(pid, 'parent')
            let p = next(id)
            while (!isEmpty(p)) {
                r.unshift(p)
                p = next(p)
            }
            return r
        },

        // 获取子目录
        folder_getChildren(id, obj = false) {
            let r = obj ? {} : []
            this.entries((k, v) => {
                if (v.parent == id && k != id) {
                    k = this.getIndex(v, k)
                    obj ? r[k] = v : r.push(k)
                }
            })
            return r
        },

        // 获取所有子目录
        folder_getChildrens(id, obj = false) {
            let r = obj ? {} : []
            this.entries((k, v) => {
                if (k != id && this.folder_getParents(k).includes(id)) {
                    k = this.getIndex(v, k)
                    obj ? r[k] = v : r.push(k)
                }
            })
            return r
        },

        // 删除目录
        folder_remove(id, remove = true) {
            // TODO: 提示是否删除所有获取子目录
            // let remove = false
            let parent = this.folder_getParent(id)
            this.folder_getChildrens(id).forEach(child => {
                let index = this.find(child) // 目录id转所在下标
                if (remove) {
                    this.remove(index)
                } else {
                    this.merge(index, { parent }) // 更改子目录到同级目录
                }
            })
            this.remove(id)
        },

        // 获取下个ID
        getNextId() {
            let len = this.count()
            if (len > 0) {
                len = this.getChild(len - 1).id + 1
            }
            return len
        },

        folder_sort(type, list) {
            if (!type) type = g_filter.getOpts(`filter.${_type}.type`, 'sz')
            if (!list) list = this.getIndexs()
            return g_sort.sort(type, list)
        },

        folder_edit(fid, parent = '') {
            let d = Object.assign({
                icon: _icon,
                title: '',
                parent,
            }, this.get(fid) || {})

            let id = _type + '_edit'
            g_form.confirm(id, {
                elements: {
                    title: {
                        title: '名称',
                        required: true,
                        value: d.title,
                    },
                    parent: {
                        title: '父目录',
                        type: _type,
                        value: d.parent,
                        otps: {
                            multi: false,
                        }
                    },
                    icon: {
                        title: '图标',
                        type: 'icon',
                        value: d.icon,
                        placeholder: '输入网址使用网络图片',
                    }
                },
            }, {
                id,
                title: '编辑',
                btn_ok: '保存',
                onBtnClick: (btn, modal) => {
                    if (btn.id == 'btn_ok') {
                        let vals = g_form.getVals(id)
                        vals.parent = vals.parent[0] || ''
                        if (fid == undefined || fid < 0) fid = this.getNextId()
                        this.set(fid, vals)
                    }
                }
            })
        },

    })

    g_plugin.registerEvent('db_connected', ({ opts }) => {
        if (opts.type === DB_TYPE_DEFAULT) { // 连接数据库后获取列表
            self.refresh('first')

        }
    })

    g_db.db.exec(`
         CREATE TABLE IF NOT EXISTS ${_type}(
             id     INTEGER PRIMARY KEY AUTOINCREMENT,
             title   VARCHAR(256),
             icon   TEXT,
             desc   TEXT,
             meta   TEXT,
             parent     INTEGER,
             ctime     INTEGER
         );

         CREATE TABLE IF NOT EXISTS ${_table}(
             fid    INTEGER PRIMARY KEY,
             ids    TEXT
         );
    `)

    g_plugin.registerEvent('db_afterInsert', ({ opts, ret, meta, method }) => {
        let fid = ret.lastInsertRowid
        if (meta && fid > 0 && method == 'insert' && opts.table == 'files') {
            let ids = meta[_type]
            if(Array.isArray(ids)){
                delete meta[_type]
                self.setItemFolder(fid, self.folder_toIds(ids))
            }
        }
    })

    g_data.table_indexs[_type] = ['id', 'title', 'icon', 'desc', 'meta', 'parent', 'ctime']
    g_data.table_indexs[_table] = ['fid', 'ids']

    g_detail.inst[_type] = { set: self.setItemFolder, get: self.getItemFolder, remove: self.removeItemFolder, type: 'deepFolder', self }
    return self

}