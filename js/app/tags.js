var g_tags = {
    tags: [],
    folders: {
        folder1: ['a_tag1'],
        folder2: ['b_tag3'],
    },
    tags_last: {}, // 最后一次搜索排序结果
    async init() {
        const self = this
        // 注册文件夹排序
        // todo 未分组放在第一个
        g_sort.set('tag_folder', tag => g_tags.tag_getFolder(tag) || '未分组')

        g_action.
        registerAction({
            showTag(dom){
                self.showTag(dom.dataset.tag)
            }
            // selectedList: dom => {

            // },
            // tag_unselected: dom => {
            //     g_tags.getOption(dom.value).click()
            // }
        })
    },
    instance: {},
    list: {},
    register(name, opts) {
        this.list[name] = opts
        this.instance[name] = new groupList(name, opts)
        return this.instance[name]
    },

    // TODO 一个标签缓存器。

    // 暴力遍历所有标签
    async tag_fetchAll() {
        let r = {}
        let tags = await g_data.all(`SELECT tags FROM videos WHERE tags != ''`)
        tags.forEach(({ tags }) => {
            // TODO 获取标签总标记数量？
            tags.split('||').filter(tag => tag.trim() != '').forEach(tag => {
                if (!r[tag]) r[tag] = 0
                r[tag] += 1
            })
        })
        return r
    },

    tag_search(tags) {
        return g_data.all('SELECT * FROM videos '+this.tag_getRule(tags))
    },

    tag_getRule(tags) {
        return `WHERE deleted=0 AND tags LIKE '%||${(Array.isArray(tags) ? tags : [tags]).join('||')}||%'`
    },

    showTag(tags) {
        g_datalist.rule_new({
            title: '标签搜索',
            rule: this.tag_getRule(tags)
        })
    },

    // 返回所有标签
    tag_all() {
        return this.tags
    },

    // 返回标签所在的目录
    tag_getFolder(tag) {
        return Object.keys(this.folders).find(folder => this.folders[folder].includes(tag))
    },

    // 标签分组
    tag_sort(type = 'sz', tags) {
        if (!type) type = g_filter.getOpts('filter.tag.type')
        if (!tags) tags = this.tag_all()
        return g_sort.sort(type, tags)
    },

    item_toggleTags(md5, added, removed) {
        g_data.data_arr_changes(md5, 'tags', added, removed)
    },

    item_setTags(md5, tag, add = true) {
        return g_data.data_arr_toggle(md5, 'tags', tag, add)
    },
}

g_tags.init()
//  var obj
// confirm(`<div id="test_tag"></div>`, {
//     onShow: () => {
//        obj = g_tags.register('filter_tag', {
//             container: '#test_tag',
//             defaultList: 'sz',
//             onSelectedList(name) {
//                 // g_filter.setOpts('filter.tag.type', action[1])
//                 return g_tags.tag_sort(name)
//             },
//             onSelectedOption(option) {
//                 console.log(option)
//             }
//         })
//         obj.show()
//     }
// }).then(() => {
//     console.log(obj.getSelected())

// })