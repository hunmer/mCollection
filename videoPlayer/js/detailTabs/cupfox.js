let g_cupfox = {
    init() {
        const self = this
        g_action.registerAction({
            cb_search(dom, action, e){
                if(e.keyCode == 13){
                    let val = dom.value
                    if(!isEmpty(val)) self.search(val)
                }
            }
        })

        this.sha1 = require('./js/plugins/sha1.min.js')
    },

    search(keyword){
        $('#cb_search').html('<div class="w-full text-center loading"><div class="spinner-grow text-center text-blue mt-3" role="status"></div></div>')
        fetch(`https://api.cupfox.app/api/v2/search/?text=${keyword}&type=0&from=0&size=50&token=`+this.sha1(keyword+'URBBRGROUN')).then(resp => {
            resp.json().then(json => {
                this.parse(json)
            })
        })
    },

    parse(data){
        console.log(data)
        let h = ''
        data.resources.forEach(item => {
            h += `
                <div class="col-6" data-action="playlist_loadURL,${item.url}">
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
        $('#cb_search').html(h ? `
            <div class="row g-3">${h}</div>
            ` : `
            <h4 class="text-center mt-3">没有任何搜素结果...</h4>
        `)
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
            <div class="input-group position-relative">
                <i class="ti ti-search fs-2 position-absolute" style="left: 10px;top: 8px;z-index: 999;"></i>
                <input style="padding-left: 35px;" type="text" class="form-control" placeholder="搜索..." data-keydown="cb_search" value="少年派">
                <button type="button" class="btn" data-action="books_add"><i class="ti ti-plus fs-2"></i></button>
                <button data-bs-toggle="dropdown" type="button" class="btn dropdown-toggle dropdown-toggle-split" aria-expanded="false"></button>
                <div class="dropdown-menu dropdown-menu-end" style="">
                   <a class="dropdown-item" href="#" data-action="books_upload">
                    编辑站点
                  </a>
                </div>
            </div>
            <div class="overflow-y-auto h-full" style="padding-bottom: 50px;" id="cb_search">
               <h4 class="mt-3 text-center">输入关键词开始搜素...</h4>
            </div>
            `
    },
}, g_cupfox)