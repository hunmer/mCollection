var g_tag = {
    getHtml(name, selected = [], all = true) {
        let h = ''
        this.tags.forEach(tag => {
            // TODO 显示标签存在的视频数量 隐藏空标签 显示所有标签按钮
            let i = g_coll.coll_count((key, value) => value.tags && value.tags.includes(tag))
            if(i > 0 || all){
                 h += `
                     <label class="form-check form-check-inline tag" data-tag="${tag}">
                        <input type="checkbox" class="form-check-input" name="${name}" value="${tag}" ${selected.includes(tag) ? 'checked' : ''}>
                        <span class="form-check-label">
                            <span class="badge badge-outline text-blue me-1">${i}</span>
                            ${tag}
                        </span>
                    </label>
                `
            }
        })
        return h
    },

    init() {
        const self = this
        this.tags = getConfig('tags', [])

        g_menu.registerMenu({
            name: 'tag_item',
            selector: '.tag',
            dataKey: 'data-tag',
            items: [
                /*{
                    icon: 'pencil',
                    text: '编辑',
                    action: 'account_item_edit'
                }, */
                {
                    icon: 'trash',
                    text: '删除',
                    class: 'text-danger',
                    action: 'tag_item_delete'
                }
            ]
        });

        g_action.registerAction(['tag_item_delete'], (dom, action) => {
            let tag = g_menu.key
            switch (action[0]) {
                case 'tag_item_delete':
                    if (self.remove(tag)) toast('成功删除标签', 'success')
                    g_menu.target.remove()
                    break;
            }
            g_menu.hideMenu('tag_item')
        })
    },

    save() {
        setConfig('tags', this.tags)
    },

    index(tag) {
        return this.tags.indexOf(tag)
    },

    add(tag) {
        let i = this.index(tag)
        if (i == -1) {
            this.tags.push(tag)
            this.save()
            return true
        }
    },

    remove(tag) {
        let i = this.index(tag)
        if (i != -1) {
            // TODO 删除视频所有包含此标签的
            this.tags.splice(i, 1)
            this.save()
            return true
        }
    }

}

g_tag.init()