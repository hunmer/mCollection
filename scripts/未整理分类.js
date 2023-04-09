// ==UserScript==
// @name    未整理分类
// @version    1.0
// @author    hunmer
// @description    增加无标签和无文件夹分类到侧边栏
// @namespace    3c5569cc-ce47-4733-a4f0-bc2d1df926f6

// ==/UserScript==
g_rule.register('noSort', {
    title: '未整理',
    sqlite: {
        method: 'select',
        search: 'id,md5',
        table: 'files',
        args: { noFolder: `LEFT JOIN folders_meta ON files.id=folders_meta.fid`, noTags: `LEFT JOIN tags_meta ON files.id=tags_meta.fid` },
        where: { noFolder: 'folders_meta.fid IS NULL', noTags: 'tags_meta.fid IS NULL' }
    },
    sidebar: {
        title: `未整理<span class="badge badge-outline text-blue ms-2" data-ruleBadge="noSort">0</span>`,
        icon: 'pencil',
        action: 'category,noSort',
    },
})
