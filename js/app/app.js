var g_app = {

    init() {
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
            about: () => {
                alert(`
                    <div class="row">
                        <div class="card">
                            <div class="card-body p-4 text-center">
                                <span class="avatar avatar-xl mb-3 avatar-rounded" style="background-image: url(https://github.com/hunmer.png)"></span>
                                <h3 class="m-0 mb-1"><a href='#' onclick="ipc_send('url', 'https://github.com/hunmer')">@hunmer</a></h3>
                                <div class="text-muted">liaoyanjie2000@gmail.com</div>
                                <div class="mt-3 d-flex justify-content-evenly">
                                    <a class="btn btn-github" data-action="homepage>
                                        <i class="ti ti-brand-github fs-2 me-2"></i>Github
                                    </a>
                                    <!-- <a class="btn btn-instagram" data-url="https://bbs.neysummer2000.fun/">
                                        <i class="ti ti-message-report fs-2 me-2"></i>Feedback
                                    </a> --!>
                                </div>
                            </div>
                            <div class="ribbon bg-yellow fs-3 cursor-pointer" data-action="homepage">
                                <b>给个Star呗~</b>
                                <i class="ti ti-star ms-2"></i>
                            </div>
                            <div class="card-body">
                                <ul class="timeline timeline-simple" id='update_logs'></ul>
                            </div>
                        </div>
                    </div>
                `, {
                    title: '关于',
                    id: 'about',
                    static: false,
                    buttons: [],
                    onShow: () => {
                        this.update_setLogs({
                            '1.0.0': {
                                date: '2023/04/16',
                                title: '软件发布',
                                text: '基本功能实现'
                            }
                        })
                    }
                })
            },
            homepage: () => ipc_send('url', 'https://github.com/hunmer/mCollection'),
            menu: dom => g_dropdown.show('menu', dom),
            update: () => toast('请在应用启动器(mLauncher)里更新...')
        })
    },

    update_setLogs(data) {
        let h = ''
        for (let [v, d] of Object.entries(data)) {
            h += `
                <li class="timeline-event">
                    <div class="card timeline-event-card">
                    <div class="card-body">
                        <div class="text-muted float-end">${d.date}</div>
                        <h4>【${v}】 ${d.title}</h4>
                        <p class="text-muted">${d.text}</p>
                    </div>
                    </div>
                </li>
            `
        }
        $('#update_logs').html(h)
    },

}

g_app.init()