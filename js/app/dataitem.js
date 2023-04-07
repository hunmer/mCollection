// 列表项目
var g_item = {
    init() {
        const self = this

        g_menu.registerMenu({
            name: 'datalist_item',
            selector: '.datalist-item',
            dataKey: 'data-md5',
            items: [{
                text: '新窗口打开',
                action: 'item_open,new'
            }, {
                text: '设置封面',
                action: 'item_cover'
            }, {
                text: '删除',
                icon: 'trash',
                class: 'text-danger',
                action: 'item_trash'
            }, {
                text: '复原',
                icon: 'arrow-back-up',
                class: 'text-primary',
                action: 'item_untrash'
            }, {
                text: '输出数据',
                icon: 'list-details',
                action: 'item_print'
            }, {
                text: '打开目录',
                icon: 'current-location',
                action: 'item_location'
            }, {
                text: '打包成压缩包',
                icon: '',
                action: ''
            }, {
                text: '发送到数据库',
                icon: 'box',
                action: 'dropdown_show,db_list,end-top'
            }],
            async onShow(){
                let trashed = await g_item.item_isTrashed(g_menu.key)
                getEle('item_untrash').toggleClass('hide', !trashed)
                getEle('item_trash').toggleClass('hide', trashed)
            },
            onHide(){
                g_preview.unpreview();
            }
        });

        g_hotkey.hotkey_register('delete', { title: '删除', content: "doAction('item_trash')", type: 2 })
        g_hotkey.hotkey_register('ctrl+keyt', { title: '标签', content: "getEle('detail_tags').click()", type: 2 })

        g_dropdown.register('db_list', {
            position: 'end-top',
            offsetLeft: 5,
            autoClose: 'true',
            list() {
                let list = g_db.toDropdown('item_moveTo')
                delete list[g_db.current]
                return list
            },
        }).init()

        g_action.
        registerAction(['item_open', 'item_trash', 'item_untrash', 'item_cover', 'item_print', 'item_location', 'item_moveTo'], (dom, action) => {
            let keys = self.selected_keys()
            if (!keys.length) {
                if (g_menu.key == undefined) return
                keys = [g_menu.key]
            }

            keys.forEach(async md5 => {
                let data = await g_data.data_get(md5)
                let div = self.item_get(md5)
                switch (action[0]) {
                    case 'item_moveTo':
                        let path = g_db.db_getVal(action[1], 'path')
                        g_data.data_setWithDB(md5, data, path + '\\items.db').then(ret => {
                            if (ret.changes) {
                                // 移动文件并删除列表项目
                                let from = g_db.getSaveTo(md5)
                                let to = g_db.getSaveTo(md5, path)
                                if (!nodejs.fs.moveSync(from, to, { overwrite: true })) {
                                    div.remove()
                                    g_data.data_remove(md5)
                                    return toast('移动成功', 'success')
                                }
                            }
                            toast('移动失败', 'danger')
                        })
                        break;
                    case 'item_location':
                        ipc_send('openFolder', getFilePath(await self.item_getVal('file', data)))
                        break;
                    case 'item_print':
                        console.log(data)
                        break;
                    case 'item_cover':
                        g_ffmpeg.video_cover(md5, g_preview.video_get().currentTime)
                        break;
                    case 'item_open':
                        break;
                    case 'item_untrash':
                        if (await g_item.item_toTrash(md5, false)) {
                            div.remove()
                            toast('成功复原', 'success')
                        }
                        break;
                    case 'item_trash':
                        if (await g_item.item_toTrash(md5)) {
                            div.remove()
                            toast('成功移除', 'success')
                        }
                        break;
                }
            })
            g_menu.hideMenu('datalist_item')
        })
        .registerAction({
            item_preview: async (dom, action, e) => {
                // if(e.ctrlKey) return
                let md5 = getParentAttr(dom, 'data-md5')
                doAction('item_unpreview')
                g_preview.preview(dom, await g_data.data_get(md5))
            },
            item_click: (dom, action, e) => {
                if (e.shiftKey) { // 范围选中
                    let list = self.selected_list()
                    if (list.length) {
                        let par = $(dom).parents('.datalist-items')
                        let i1 = $(list[0]).index()
                        let i2 = $(dom).index()
                        for (let i = Math.min(i1, i2); i <= Math.max(i1, i2); i++) {
                            par.find(`.datalist-item:eq(${i})`).addClass('item_selected')
                        }
                    }
                } else {
                    if (!e.ctrlKey) self.selected_clear()
                    $(dom).toggleClass('item_selected')
                }
                self.selected_update()
            },
            item_unselected: dom => {
                // 从选中列表中移除
                $('.datalist-item')
                self.item_get(dom.dataset.md5).removeClass('item_selected')
                self.selected_update()
            },
            item_dbclick: dom => {
                // 全屏预览文件
                g_preview.fullPreview(dom, dom.dataset.md5)
            },
            item_selected_clear: dom => self.selected_clear(),

        })
    },

    // 更新选中显示
    selected_update() {
        g_detail.showList(this.selected_keys())
    },

    // 返回选中
    selected_list() {
        return $('.item_selected')
    },

    // 返回选中md5
    selected_keys() {
        let r = []
        for (let d of $('.item_selected')) r.push(d.dataset.md5)
        return r
    },

    // 清除选中
    selected_clear() {
        this.selected_list().removeClass('item_selected')
        this.selected_update()
    },

    // 获取item属性
    item_getVal(type, md5, table) {
        let fun = (d) => {
            let v
            let r = {}
            let { md5, title, link } = d
            let path = g_db.getSaveTo(md5)
            let format = getFileType(d.title)

            let isArr = Array.isArray(type)
            if (!isArr) type = [type]

            type.forEach(n => {
                v = ''
                switch (n) {
                    case 'file':
                        v = link || path + title
                        break

                    case 'cover':
                        // TODO 在插入文件的时候就要让服务器执行对应的操作（缩略图，颜色等)
                        // TODO 不判断是否存在，而是用image加载错误事件
                        // TODO 音乐显示专辑 播放时才显示音波

                        if (format == undefined) {
                            v = './res/file.png' // 未知文件封面
                        } else {
                            v = path + (format == 'audio' ? 'wave.png' : 'cover.jpg')
                            // TODO 自定义封面？

                            // 判断云盘文件是否存在会卡顿
                            if (!nodejs.files.exists(v)) {
                                v = './res/loading.gif'
                                // 生成封面
                                // TODO 传入事件让插件生成对应的缩略图
                                g_ffmpeg.markCover(md5)
                            }
                        }
                        break;
                }
                r[n] = v
            })
            return isArr ? r : v
        }
        if (typeof(md5) == 'object') return fun(md5)
        return g_data.data_getData(md5, table).then(data => fun(data))
    },

    // 设置封面显示
    item_setCover(md5, img) {
        this.item_get(md5).find('.thumb').attr('src', img)
    },

    // 保存封面
    item_saveCover(md5, img) {
        g_plugin.callEvent('image.saveCover', { md5, img }).then(({ md5, img }) => {
            this.item_setCover(md5, img)
        })
    },

    // 返回元素
    item_get(md5) {
        return $(`.datalist-item[data-md5="${md5}"]`)
    },

    async item_update(md5) {
        let data = await g_data.data_get(md5)
        let html = await g_datalist.item_parse({data})
        let dom = $(html)
        this.item_get(md5).replaceWith(dom)
        g_datalist.tab_appendItems(dom)
    }

}

g_item.init()