g_datalist.view_register('default', {
    init(){
        let view = '.datalist[data-view="default"]'
        let item = '.datalist-item'
        g_style.addStyle('view_default', `
            ${view} ${item} {
                max-height: 200px;
            }

            ${view} ${item} img {
                height: 135px;
                object-fit: cover;
            }
        `)
    },
    container: `
        <div class="datalist" onmousewheel="g_action.do(this, 'setItemWidth', event)" data-view="default">
            <div onScroll="g_datalist.onScroll(this)" class="row row-cards overflow-y-auto datalist-items justify-content-center p-2" style="align-content: flex-start;height: calc(100vh - 100px);"></div>
        </div>
    `,
    async item(d) {
        let r = Object.values(getConfig(replaceArr(['%name', '%desc', '%duration', '%ext'], 'show,')))
        // 如何让扩展添加并修改视图？
        let { desc, media } = await g_detail.getDetail(d, ['desc', 'media'])
        let duration = media ? media.duration : 0
        return `
             <div class="datalist-item col-xs-12 col-sm-6 col-md-4 col-lg-4 col-xl-3  p-0 m-0 top-0 col-xxl-2" data-mousedown="item_click" data-dbclick="item_dbclick" {md5} {dargable}>
                <div class="card card-sm h-full position-relative justify-content-center">
                  ${OR(r[3], `<span class="badge top-5 start-5 position-absolute w-fit">${getExtName(d.file)}</span>`)}
                  <a class="position-relative">
                    <img src="./res/loading.gif" data-src="${d.cover}" class="thumb card-img-top lazyload" {preview}>
                  </a>
                  ${r[0] || r[1] || r[2] ? `
                     <div class="card-body text-nowarp">
                      <div class="d-flex align-items-center ">
                        <div>
                            ${OR(r[0], `<div>${d.title}</div>`)}
                            ${OR(r[1], `<div class="text-muted">${desc || ''}</div>`)}
                        </div>
                         <div class="ms-auto">
                            ${OR(r[2] && duration > 0, `<span class="text-muted">${getTime(duration)}</span>`)}
                          </div>
                        </div>
                      </div>
                      ` : ''}
                </div>
            </div>
        `
    }
})

