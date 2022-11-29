var g_coll = {
    init() {
        const self = this
        self.list = local_readJson('playlist_coll', {})
        g_action.registerAction({
            coll_loadPlaylist(dom){
                let url = getParentAttr(dom, 'data-playlist')
                g_playlist.parse(self.coll_get(url))
            },
            coll_remove(dom){
                let card = getParent(dom, 'data-playlist')
                self.coll_toggle(card.data('playlist'))
                card.remove()
            }
        })
    },
    coll_exists(url) {
        return this.coll_get(url) != undefined
    },
    coll_get(url) {
        return this.list[url]
    },
    coll_save() {
        local_saveJson('playlist_coll', this.list)
    },
    coll_toggle(url, vals = {}) {
        let exists = this.coll_get(url)
        if (exists) {
            delete this.list[url]
        } else {
            this.list[url] = Object.assign({

            }, vals)
        }
        this.coll_save()
        let btn = getEle({ action: 'playlist_coll_toggle' }, '', getEle({ playlist: url }))
        btn.length && btn.attr('class', 'btn btn-pill btn-'+(exists ? 'ghost' : '')+'warning')
        return !exists
    },
    coll_update() {
        let h = ''
        for (let [url, d] of Object.entries(this.list)) {
            h += `
                <div class="col-4 p-2 mt-2 card" style="height: 300px;" data-playlist="${url}">
                    <div class="ribbon ribbon-end ribbon-top bg-white w-unset fs-5 p-1">
                        <a class="ms-3 text-muted" data-action="coll_remove">
                            <i class="ti ti-star fs-2 mr-2 ${this.coll_exists(url) ? 'text-warning' : ''}"></i>
                        </a>
                    </div>
                    <img src="${d.cover}" class="border rounded-3 h-full" data-action="coll_loadPlaylist">
                    <b>${d.title}</b>
                </div>
            `
        }
        $('#coll_list').html(h ? `
            <div class="row">
                ${h}
            </div>
        ` : `
            <h4 class="text-center mt-3">还没有任何收藏...</h4>
        `)
    },
}

g_detailTabs.register('coll', {
    onTabChanged: old => {
        console.log('update')
        g_coll.coll_update()
    },
    tab: {
        id: 'coll',
        title: '<i class="ti ti-star fs-2"></i>',
        html: `
            <div class="overflow-y-auto h-full p-2" style="padding-bottom: 50px;" id="coll_list">
               
            </div>
            `
    },
}, g_coll)