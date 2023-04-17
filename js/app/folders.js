var g_folders = require('./js/app/deepFolder.js')({
    type: 'folders',
    icon: 'folder',
    defaultTitle: '未命名文件夹',
    detailPlaceholder: '<i class="ti ti-folder-plus"></i>',
    defaultList: [{
        id: 0,
        title: '浏览器导入',
        icon: 'folder',
        primary: 9999,
        parent: '',
        ctime: new Date().getTime()
    }],
    sidebar: {
            title: '无分组<span class="badge badge-outline text-blue ms-2" data-ruleBadge="noFolder">0</span>',
            icon: 'question-mark',
            action: 'category,noFolder',
        },
})

g_hotkey.register('ctrl+keyf', { title: '设置文件夹', content: "getEle('detail_folders').click()", type: 2 })

g_rule.register('noFolder', {
    title: '无分组',
    sqlite: {
        method: 'select',
        search: 'md5',
        table: 'files',
        args: {noFolder: `LEFT JOIN folders_meta ON files.id=folders_meta.fid`},
        where: {noFolder: 'folders_meta.fid IS NULL'}
    }
})

g_action.registerAction('search_folders_item', dom => {
    g_folders.showFolder(dom.dataset.value)
    g_search.modal.method('hide')
})

g_search.tabs_register('folders', {
    tab: {
        icon: 'folder',
        title: '文件夹',
        getTabIndex: () => 2,
        html: g_search.replaceHTML(`%search_bar%<div class="search_result list-group list-group-flush overflow-auto"></div>`)
    },
    onSearch(s) {
        let r = []
        g_folders.entries((k, v) => {
            // 有子目录的不要
            if (!g_folders.folder_getChildren(k).length) {
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
            <div class="list-group-item result_item" data-action="search_folders_item" data-value="${item.value}" tabindex="0">
              <div class="row">
                <div class="col-auto">
                  <a href="#" tabindex="-1">
                    <span class="avatar"><ti class="ti ti-${item.icon} fs-2"></i></span>
                  </a>
                </div>
                <div class="col text-truncate">
                  <a href="#" class="text-body d-block" tabindex="-1">${item.title}</a>
                  <div class="text-muted text-truncate mt-n1"></div>
                </div>
              </div>
            </div>
        `
    }
})