// ==UserScript==
// @name    相似图片
// @version    1.0
// @author    hunmer
// @description    查找相似图片(hash)
// @updateURL   https://neysummer2000.fun/mCollection/scripts/相似图片.txt
// @namespace    0b0e996b-4554-4973-b9c1-2c994bcf117c
// ==/UserScript==
({
    getHash(file) {
        return new Promise(reslove => this.worker.send(['getHash', file], reslove))
    },

    removeHash(md5) {
        return g_data.data_remove2({ table: 'hash_meta', key: 'md5', value: md5 })
    },

    setHash(md5, hash) {
        return g_data.data_set2({ table: 'hash_meta', key: 'md5', value: md5, data: { md5, hash } })
    },

    async getHashData(md5) {
        return (await g_data.data_get1({ table: 'hash_meta', key: 'md5', value: md5 }) || {}).hash
    },

    compare(hash1, hash2) {
        const minLength = Math.min(hash1.length, hash2.length);
        const maxLength = Math.max(hash1.length, hash2.length);
        let similarity = 0;
        for (let i = 0; i < minLength; i++) {
            if (hash1[i] === hash2[i]) {
                similarity += 1;
            }
        }
        return similarity / maxLength;
    },

    async compareHash(hash, less = .5, max = 20) {
        let r = []
        let all = await g_data.all('SELECT * FROM hash_meta')
        all.forEach(item => {
            let simi = this.compare(hash, item.hash)
            if (simi >= less) {
                item.value = simi
                r.push(item)
            }
        })
        return r.sort((a, b) => b.value - a.value).splice(0 - max)
    },

    async search(md5){
        g_menu.hideMenu('datalist_item')
        let hash = await this.getHashData(md5)
        if(hash){
            let list = await this.compareHash(hash)
            let items = await Promise.all(list.map(item => g_data.data_get(item.md5)))
            let html = await g_datalist.view_parseItems('default', items)
            // TODO 色彩第二次过滤...
            alert('', {title: list.length+'条搜索结果...', width: '80%', onShow(modal){
                html.appendTo(modal.find('.modal-body')).find('.lazyload').lazyload()
            }})
        }
    },

    init() {
        g_menu.list.datalist_item.items.push({
            text: '本地查找相似项目',
            icon: 'search',
            class: 'text-warning',
            action: 'hash_search',
        })
        g_action.registerAction('hash_search', () => this.search(g_menu.key))

        this.worker = new Worker_IPC('scripts/相似图片_worker.js');
        g_plugin.registerEvent('db_connected', () => {
            g_db.db.exec(`
            CREATE TABLE IF NOT EXISTS hash_meta(
                md5     TEXT(32),
                hash    TEXT(64)
            );`)
        })
        g_data.table_indexs.hash_meta = ['md5', 'hash']
        g_plugin.registerEvent('image.saveCover', async ({ md5, img }) => {
            let hash = await this.getHash(img)
            this.setHash(md5, hash)
        })
    }

}).init()
