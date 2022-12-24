var g_app = {

    init: function() {
        g_dropdown.register('menu', {
            position: 'top-end',
            offsetLeft: 5,
            list(){
                return {
                    db: {
                        title: '资源库',
                        icon: 'box',
                        action: 'db_menu',
                    }
                }
            }
        })

        g_action.
        registerAction({
            about: dom => {
                alert(`
            <div class="row">
                <div class="card">
                  <div class="card-body p-4 text-center">
                    <span class="avatar avatar-xl mb-3 avatar-rounded" style="background-image: url(https://github.com/hunmer.png)"></span>
                    <h3 class="m-0 mb-1"><a href='#' onclick="ipc_send('url', 'https://github.com/hunmer')">@hunmer</a></h3>
                    <div class="text-muted">liaoyanjie2000@gmail.com</div>
                    <div class="mt-3">
                      <span class="badge bg-purple-lt">DEV</span>
                    </div>
                  </div>
                  <div class="ribbon bg-yellow fs-3 cursor-pointer" data-action="homepage">
                    <b>给个Star呗~</b>
                    <i class="ti ti-star ms-2"></i>
                  </div>
                  <div class="card-body">
                    <ul class="list list-timeline" id='update_logs'>
                    </ul>
                  </div>
                </div>
            </div>
        `, {
                    title: '关于',
                    id: 'about',
                    static: false,
                    onShow: () => {
                        this.update_setLogs({
                            '1.0.0': {
                                date: '2022/10/27',
                                title: '软件发布',
                                text: '基本功能实现'
                            }
                        })
                    }
                })
            },
            homepage: () => ipc_send('url', 'https://github.com/hunmer/mCollection'),
            menu: dom => g_dropdown.show('menu', dom)
        })
    },

    update_setLogs(data) {
        let h = ''
        for (let [v, d] of Object.entries(data)) {
            h += `
                <li>
                    <div class="list-timeline-icon bg-twitter">${v}</div>
                    <div class="list-timeline-content">
                      <div class="list-timeline-time">${d.date}</div>
                      <p class="list-timeline-title">${d.title}</p>
                      <span class="text-muted">${d.text}</span>
                    </div>
                  </li>
            `
        }
        $('#update_logs').html(h)
    },


}

g_app.init()