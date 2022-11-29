var g_tag = {
    getHtml(name, selected = []) {
        let h = ''
        this.tags.forEach(tag => {
            h += `
                 <label class="form-check form-check-inline">
                    <input type="checkbox" class="form-check-input" name="${name}" value="${tag}" ${selected.includes(tag) ? 'checked' : ''}>
                    <span class="form-check-label">${tag}</span>
                </label>
            `
        })
        return h
    },

    init() {
        this.tags = getConfig('tags', [])
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

}

g_tag.init()