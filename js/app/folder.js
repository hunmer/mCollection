g_folder.init({
    saveData: (name, data) => g_db.db_saveJSON(name, data),
    getData: name => g_db.db_readJSON(name, {}),
    update(save = false) {
        g_category.category_set('folder', {
            title: '常用',
            action: 'category_folder',
            list: this.folder_getItems('', true)
        })
        $(`[data-list="folder"]`).prop('draggable', true)
        save && this.save()
    },
})

g_action.
registerAction({
    category_folder: dom => { // 展开目录
        let name = dom.dataset.name
        let h = ''
        let datas = []
        for (let [k, v] of Object.entries(self.folder_getItems(name, true))) {
            datas.push({
                html: g_category.item_html(k, 'folder', v, 'category_folder'),
                group: name
            })
        }
        if (datas.length) { // 继续展示子目录
            // todo 一个选项，同时展示目录项目
            // todo 内容显示子目录封面列表
            let id = 'category_folder_' + name
            let div = $("#accordion-" + id)
            if (div.length) return div.remove(); // 隐藏

            let accordion = g_tabler.build_accordion({
                id: id,
                datas: datas,
                default: true,
                parent: false,
                header: '<span class="badge bg-primary">{i}个子目录</span>',
                onOpen: e => {
                    let group = e.currentTarget.dataset.collapse
                },
                collapse_start: `<div class="list-group list-group-flush">`,
                collapse_end: `</div>`,
            })
            accordion.find(`[data-list="folder"]`).prop('draggable', true)
            $(dom).parent('.row').append(accordion)

        }
        // 如果存在父目录过滤器，则应用规则
        g_datalist.tabs.tab_getTypes('folder', self.folder_getFolder(name)).forEach(tab => {
            // 应该更新父tab的 太麻烦了直接删了
            g_datalist.tab_remove(tab)
        })

        // 或者有按住ctrl
        g_datalist.rule_new(g_filter.getPreset('folder', name)) // TODO 更精准查找?
        // 直接展示目录项目
    }
})

// 右键菜单
g_category.
registerAction('folder', (dom, action) => {
    let folder = action[2]
    self.menu_folder = folder // TODO 设置dropdown的key
    g_dropdown.show('actions_folders', dom)
})

g_dropdown.register('actions_folders', {
    position: 'top,end',
    offsetLeft: 5,
    list: {
        edit: {
            title: '编辑',
            icon: 'pencil',
            action: 'folder_edit',
        },
        create: {
            title: '新建子目录',
            icon: 'folder-plus',
            action: 'folder_newSub',
        },
        delete: {
            title: '删除',
            icon: 'trash',
            class: 'text-danger',
            action: 'folder_delete',
        },
    }
})

g_menu.registerMenu({
    name: 'folder_item',
    selector: '[data-collapse="folder"]',
    dataKey: 'data-name',
    html: g_menu.buildItems([{
        icon: 'folder-plus',
        text: '新建文件夹',
        action: 'folder_new'
    }, {
        icon: 'folders-off',
        text: '清空文件夹',
        class: 'text-danger',
        action: 'folder_clear'
    }])
});

g_drag.register('folder', {
    selector: '[data-list="folder"]',
    html: `<span class="badge bg-primary position-absolute" id="badge_darging_folder"></span>`,
    onDragStart: e => {
        e.dataTransfer.setData('folder', e.target.dataset.name);
    },
    onUpdateTarget: e => {
        let { list, name } = e.target.dataset
        // 显示badge信息
        // getElement(name)
        let badge = $('#badge_darging_folder').show()
        badge.css({
            left: e.clientX + 20,
            top: e.clientY + 20,
        })
        if (list == 'folder') {
            badge.html('移动到文件夹: ' + name)
        }
    },
    onDrop: e => {
        g_drag.hide('folder')
        let files = (e.target.files || e.dataTransfer.files)
        let from = e.dataTransfer.getData('folder')
        let { list, name } = e.target.dataset
        if (list == 'folder' && name != from) {
            if (!isEmpty(from)) { // 目录之间的层级移动
                // TODO 设置为目标的子目录或者同级目录
                // 设置父目录
                return self.folder_setValue(from, 'parent', name)
            }
            if (files.length) { // 文件接收
                if (arr_equal(g_cache.dragingFile, Object.values(files).map(v => v.path))) { // 从软件拖拽的文件
                    // 更改目录
                    let i = 0
                    g_cache.dragingMD5s.forEach(md5 => {
                        // 是不是直接移动到文件夹要设置一个目录？？
                        if (g_folder.item_setFolders(md5, name, true)) {
                            i++
                        }
                    })
                    return toast('成功设置 ' + i + ' 个文件的目录');
                }
            }
        }
    }
})