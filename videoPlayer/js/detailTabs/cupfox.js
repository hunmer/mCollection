let g_cupfox = {
    init() {
        const self = this
        g_action.registerAction({
            cb_search(dom, action, e){
                if(e.keyCode == 13){
                    let val = dom.value
                    if(!isEmpty(val)) self.search(val)
                }
            },
            link_parse(){
                prompt(getClipboard(), {
                    title: '输入播放列表URL'
                }).then(url => {
                    if(!isEmpty(url)) g_playlist.parse_url(url)
                })
            }
        })

        this.sha1 = require('./js/plugins/sha1.min.js')
    },

    search(keyword){
        $('#cb_search').html('')
        setConfig('cb_lastSearch', keyword)
        for(let i = 0; i < 2; i++){
            fetch(`https://api.cupfox.app/api/v2/search/?text=${keyword}&type=0&from=${i * 20}&size=20&token=`+this.sha1(keyword+'URBBRGROUN')).then(resp => {
                resp.json().then(json => {
                    this.parse(json)
                })
            })
        }
    },

    parse(data){
        console.log(data)
        let h = ''
        data.resources.forEach(item => {
            h += `
                <div class="col-6" data-target="${item.url}" data-action="playlist_loadURL" data-contenx="playlist_openURL">
                    <div class="row align-items-center p-2">
                      <a href="#" class="col-auto">
                        <span class="avatar" style="background-image: url(${item.icon})">
                      </a>
                      <div class="col text-truncate">
                        <a href="#" class="text-reset d-block text-truncate">${item.text}</a>
                        <div class="text-muted text-truncate mt-n1">${(() => {
                            let s = ''
                            let getColor = i => {
                                let arr = ['blue', 'azure', 'indigo', 'purple']
                                return arr[i % arr.length]
                            }
                            [item.website].concat(item.tags).forEach((tag, i) => {
                                s += `<span class="badge bg-${getColor(i)}-lt me-2">${tag}</span>`
                            })
                            return s
                        })()}</div>
                      </div>
                    </div>
                </div>
            `
        })
        h && $('#cb_search').append(h)
    },
}
g_detailTabs.register('cupfox', {
    onTabChanged: old => {

    },
    onVideoEvent: (type, { tab }) => {
        if (type == 'show') {

        }
    },
    tab: {
        id: 'cupfox',
        title: '<i class="ti ti-search fs-2"></i>',
        html: `
            <div class="input-group position-relative" style="z-index: 1">
                <i class="ti ti-search fs-2 position-absolute" style="left: 10px;top: 8px;z-index: 999;"></i>
                <input style="padding-left: 35px;" type="text" class="form-control" placeholder="搜索..." data-keydown="cb_search" value="${getConfig('cb_lastSearch', '')}">
                <button type="button" class="btn" data-action="link_parse"><i class="ti ti-link fs-2"></i></button>
                <button data-bs-toggle="dropdown" type="button" class="btn dropdown-toggle dropdown-toggle-split" aria-expanded="false"></button>
                <div class="dropdown-menu dropdown-menu-end" style="">
                   <a class="dropdown-item" href="#" data-action="books_upload">
                    编辑站点
                  </a>
                </div>
            </div>
            <div class="overflow-y-auto h-full row g-3" style="padding-bottom: 200px;" id="cb_search">
            </div>
            `
    },
}, g_cupfox)