 g_setting.setDefault('proxy', 'http://127.0.0.1:4780')
 g_setting.setDefault('dataPath', __dirname + '\\')

 $(function() {
     g_action.registerAction({
         homepage: () => ipc_send('url', 'https://github.com/hunmer/mCollection'),
         author: () => ipc_send('url', 'https://github.com/hunmer'),
         setting_setdataPath: dom => {
             g_pp.set('dataPath', path => $('#input_dataPath').val(path[0]));
             ipc_send('fileDialog', {
                 id: 'dataPath',
                 title: '选中目录',
                 properties: ['openDirectory'],
             })
         },
         proxy_test: () => {
             let proxy = getConfig('proxy')
             if (proxy.startsWith('http')) {
                 let btn = getEle('proxy_test').addClass('btn-loading')
                 let now = () => new Date().getTime()
                 let time = now()
                 nodejs.request({
                     proxy,
                     method: "GET",
                     url: 'https://www.google.com',
                 }, function(error, resp, body) {
                     let ok = !error && resp.statusCode == 200
                     toast(ok ? '延迟: ' + (now() - time) + 'ms' : error, ok ? 'success' : 'danger')
                     btn.removeClass('btn-loading')
                 })
             }else{
                toast('不是合法的代理地址', 'danger')
             }
         },
         proxy_help() {
             confirm(`
                <p>1.下载网络代理软件(推荐0dcloud)</p>
                <p>2.开启网络代理模式</p>
                <p>3.开放HTTP代理端口</p>
            `, {
                 title: '代理帮助',
             })
         }
     })

     g_setting.onSetConfig({
         dataPath: path => {
             location.reload()
         }
     })

     g_setting.tabs = {
         general: {
             title: '常规',
             icon: 'home',
             elements: {
                 oneTab: {
                     title: '单标签页',
                     type: 'switch',
                     value: getConfig('oneTab'),
                 },
                 autoPlay: {
                     title: '自动播放视频',
                     type: 'switch',
                     value: getConfig('autoPlay'),
                 },
                 blurPause: {
                     title: '后台暂停播放',
                     type: 'switch',
                     value: getConfig('blurPause'),
                 },
             }
         },
         users: {
             title: '数据',
             icon: 'box',
             elements: {
                 dataPath: {
                     title: '数据目录',
                     type: 'file_chooser',
                     value: getConfig('dataPath'),
                     opts: {
                         title: '选择数据目录',
                         properties: ['openDirectory'],
                     },
                 },
             }
         },
         download: {
             title: '下载',
             icon: 'download',
             elements: {
                 proxy: {
                     title: '网络代理',
                     value: getConfig('proxy'),
                     html: `
                     <div class="mt-3">
                        <div class="form-label {required}">{title}</div>
                         <div class="input-group mb-2 mt-2" id="{id}">
                            <button class="btn " data-action="proxy_help"><i class="ti ti-question-mark"></i></button>
                            <input type="text" class="form-control" placeholder="http://...">
                            <button class="btn btn-primary" type="button" data-action="proxy_test">测试</button>
                          </div>
                      </div>
                     `,
                     getVal: ele => ele.find('input').val(),
                     setVal: (ele, val) => ele.find('input').val(val),
                 },
             }
         },
         about: {
             title: '关于',
             icon: 'coffee',
             elements: {
                 about: {
                     html: `<div class="row">
                        <div class="card">
                          <div class="card-body p-4 text-center">
                            <span class="avatar avatar-xl mb-3 avatar-rounded" style="background-image: url(https://github.com/hunmer.png)"></span>
                            <h3 class="m-0 mb-1"><a href='#' data-action="author">@hunmer</a></h3>
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
                                ${g_tabler.build_accordion({
                                    header: '{title}',
                                    datas: [{
                                        html: 'A:快速找镜头+在线视频剪辑+团队标记',
                                        group: '这软件是啥',
                                    }, {
                                        html: 'A:看视频教程',
                                        group: '如何使用',
                                    }, {
                                        html: 'A:随缘',
                                        group: '什么时候更新',
                                    }]
                                }, false)}
                          </div>
                        </div>
                    </div>`
                 }
             }
         },
     }
     g_setting.getConfig('darkMode') && g_setting.call('darkMode', true)
     g_setting.getConfig('oneTab') && g_setting.call('oneTab', true)
     // g_action.do(null, 'settings,general')
 });


 function getProxy() {
     let proxy = getConfig('proxy')
     return proxy ? { proxy, http_proxy: proxy, https_proxy: proxy } : {}
 }