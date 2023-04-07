var g_tags = require('./js/app/deepFolder.js')({
    type: 'tags',
    icon: 'tag',
    title: '标签',
    defaultTitle: '未命名标签',
    detailPlaceholder: '<i class="ti ti-tag"></i>',
    defaultList: [{
        id: 0,
        title: '默认标签',
        icon: 'tag',
        primary: 9999,
        parent: '',
        ctime: new Date().getTime()
    }],
    sidebar: {
        title: '无标签<span class="badge badge-outline text-blue ms-2" data-ruleBadge="noTag">0</span>',
        icon: 'tags-off',
        action: 'category,noTag',
    },
})

g_rule.register('noTag', {
    title: '无标签',
    sqlite: {
        method: 'select',
        search: 'md5',
        table: 'files',
        args: {noTag: `LEFT JOIN tags_meta ON files.id=tags_meta.fid WHERE tags_meta.fid IS NULL`},
    }
})

g_action.registerAction('search_tag_item', dom => {
    g_tags.showFolder(dom.dataset.value)
    g_search.modal.method('hide')
})

g_search.tabs_register('tags', {
    tab: {
        title: '<i class="ti ti-tag fs-2 me-2"></i>标签',
        getTabIndex: 1,
        html: g_search.replaceHTML(`%search_bar%<div class="search_result btn-list p-2"></div>`)
    },
    onSearch(s) {
        let r = []
        g_tags.entries((k, v) => {
            // 有子目录的不要
            if (!g_tags.folder_getChildren(k).length) {
                let { title, icon } = v
                if (PinYinTranslate.check(s, title)) {
                    r.push({ title, icon, value: k })
                }
            }
        })
        return r
    },
    onParse(item) {
        return `
        <button class="btn btn-outline-primary result_item" data-action="search_tag_item" data-value="${item.value}">${item.title}</button>`
    }
})