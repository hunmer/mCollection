    Object.assign(g_item, {
        // 移动到垃圾桶
        async item_toTrash(md5, remove = true) {
            let json = {}
            let insts = Object.entries(g_detail.inst)
            if (remove) {
                let data = await g_data.data_get(md5)
                await Promise.all(insts.map(async ([name, inst]) => {
                    let ret = await inst.get(data, 'trash')
                    if (inst.type == 'deepFolder') {
                        // 保存id对应的标题信息
                        json[name + '_meta'] = ret.map(id => inst.self.folder_getValue(id, 'title'))
                    }
                    json[name] = ret
                })) // 遍历接口获取所有相关数据

                let id = data.id
                delete data.id

                // await g_data.data_remove(md5, 'trash')
                let ret = await g_data.data_set(md5, Object.assign(data, {
                    meta: JSON.stringify(json),
                    last: new Date().getTime()
                }), 'trash')
                if (ret.changes > 0) {
                    g_data.data_remove(md5)
                    insts.forEach(([name, inst]) => inst.remove(id)) // 删除所有相关数据
                    return true
                }
            } else {
                let data = await g_data.data_get(md5, 'trash')
                let meta = data.meta 
                delete data.meta
                delete data.last
                // await g_data.data_remove(md5)
                let ret = await g_data.data_insert1({
                    data,
                    key: 'md5',
                    value: md5,
                    table: 'files',
                    broadcast: false, // 不触发事件
                })
                if (!ret.changes) return

                let fid = ret.lastInsertRowid
                await Promise.all(Object.entries(Object.entries(meta).map(async ([k, v]) => {
                    let inst = g_detail.inst[k]
                    if (inst) {
                        if (['folders', 'tags'].includes(k)) {
                            if (!arr_equal(v.map(id => inst.self.folder_getValue(id, 'title')), meta[k + '_meta'])) { // 目录或者标签名称发生改变
                                // TODO 弹出提示
                                return
                            }
                        }
                        await inst.set(fid, v) // 还原相关数据    
                    }
                })))
                g_data.data_remove(md5, 'trash')
                return true
            }
        },
        // 是否在垃圾桶
        async item_isTrashed(md5) {
            return await g_data.getLengths(`WHERE md5='${md5}'`, 'trash') == 1
        },
    })

    g_dropdown.register('menu_trash', {
        position: 'top-end',
        offsetLeft: 5,
        list: {
            clear: {
                title: '清空回收站',
                icon: 'trash',
                class: 'text-danger',
                action: 'trash_clear',
            }
        }
    })

    g_action.registerAction({
        menu_trash: dom => g_dropdown.show('menu_trash', dom),
        trash_clear: () => {
            confirm('你确定要删除吗？此操作不可逆!', {
                title: '清空回收站',
                type: 'danger'
            }).then(() => {
                g_datalist.tabs.search('system', 'trash').forEach(tab => g_datalist.tab_remove(tab)) // 关闭回收站tab
                g_data.run(`DELETE FROM trash`).then(() => {
                    g_rule.refresh('trash')
                    toast('成功清空回收站!', 'success')
                })
            })
        }
    })


    g_plugin.registerEvent('db_afterGetData', source => {
        // console.log(source)
        // let data = JSON.parse(source.data)
        // source = {

        // }
    })