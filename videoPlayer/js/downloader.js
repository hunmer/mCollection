var g_downloader = {
    process: [],
    init() {
        const self = this
        self.datas = local_readJson('downloads', {})
        g_setting.setDefault({
            aria2c_path: nodejs.bin + '\\',
            aria2c_config: __dirname + '\\aria2.conf',
            savePath: __dirname + '\\downloads\\'
        })

        g_setting.tabs.download = {
            title: '下载',
            icon: 'download',
            elements: {
                download_max: {
                    title: '最多同时下载',
                    value: getConfig('download_max', 3),
                },
                download_notif: {
                    title: '消息提示',
                    type: 'switch',
                    value: getConfig('download_notif'),
                },
                savePath: {
                    title: '下载目录',
                    type: 'file_chooser',
                    value: getConfig('savePath'),
                    opts: {
                        title: '选择下载目录',
                        properties: ['openDirectory'],
                    },
                },
            }
        }

        g_action.
        registerAction({
            download_title_click(dom) {
                let id = $(dom).parents('[data-download]').data('download')
                let d = self.item_get(id)
                let f = d.pathName + '/' + d.fileName
                if (nodejs.files.exists(f)) {
                    nodejs.files.openFile(f)
                }
            },
            aria2c_setting(dom) {
                g_form.confirm('aria2c_setting', {
                    elements: {
                        port: {
                            title: '端口',
                            required: true,
                            value: self.config['rpc-listen-port'],
                        },
                        maxDownloads: {
                            title: '最大同时下载',
                            required: true,
                            value: self.config['max-concurrent-downloads']
                        }
                    },
                }, {
                    id: 'aria2c_setting',
                    title: 'Aira2c设置',
                    btn_ok: '保存',
                    btn_cancel: '高级配置',
                    onBtnClick: (btn, modal) => {
                        if (btn.id == 'btn_ok') {
                            let vals = g_form.getVals('aria2c_setting')
                            // g_form.setInvalid('aria2c_setting', 'port')
                            // TODO 一些数值检查

                            self.config['rpc-listen-port'] = vals['port']
                            self.config['max-concurrent-downloads'] = vals['maxDownloads']
                            // Aria有一个方法可以修改参数，但是不确定是否端口也可以动态修改，总之先暴力重载
                            self.saveConfig()
                            location.reload()
                            return true
                        }
                        ipc_send('url', getConfig('aria2c_config'))
                        return false
                    }

                })

            },
            // 显示下载列表
            download_list(dom) {
                g_modal.modal_get('downloader').modal('show')
                self.refresh()
            },
            // 新建下载
            download_add(dom) {
                self.modal_download()
            },
            // 全部开始
            download_start(dom) {
                self.item_next()
            },
            // 全部清空
            download_clear(dom) {
                for (let id in self.datas) self.item_remove(id)
            },
            download_stopAll() {
                for (let child of self.process) {
                    nodejs.kill(child.pid, 'SIGKILL')
                }
                self.process = []
            },
            // 清空已下载
            download_clear_completed(dom) {
                for (let [id, item] of Object.entries(self.datas)) {
                    item.finish && self.item_remove(id)
                }
            },
            // 打开下载目录
            download_path(dom) {
                ipc_send('openFolder', getConfig('savePath'))
            }
        }).registerAction(['download_item_copy', 'download_item_remove', 'download_item_folder'], (dom, action, e) => {
            let k = $(dom).parents('[data-download]').data('download') || g_menu.key
            let d = self.item_get(k)
            switch (action[0]) {
                case 'download_item_folder':
                    let file =  d.pathName.replace('('+cutString(d.pathName, '(', ')', 0, false)+')', '').trim() + '\\' + d.fileName
                    if (!nodejs.files.exists(file)) {
                        g_toast.toast('文件不存在', '错误', 'danger');
                    } else {
                        ipc_send('openFolder', file)
                    }
                    break;
                case 'download_item_copy':
                    ipc_send('copy', d.url)
                    break;

                case 'download_item_remove':
                    self.item_remove(k)
                    break;
            }
            g_menu.hideMenu('download_item_menu')
        })

        g_menu.registerMenu({
            name: 'download_item_menu',
            selector: '.list-group-item[data-download]',
            dataKey: 'data-download',
            items: [{
                icon: 'link',
                text: '复制链接',
                action: 'download_item_copy'
            }, {
                icon: 'trash',
                text: '删除',
                class: 'text-danger',
                action: 'download_item_remove'
            }]
        })

        self.aria_start();
        self.refresh()

    },

    // 保存ini配置
    saveConfig() {
        nodejs.require('fs').writeFileSync(getConfig('aria2c_config'), nodejs.require('ini').stringify(this.config))
    },

    // 添加下载
    modal_download(opts = {}) {
        confirm(`<fieldset id="div_download_add" class="form-fieldset"></fieldset>`, {
            title: opts.title || '添加下载',
            id: 'modal_download_add',
            btn_ok: '添加',
            onShow: () => {
                $('#div_download_add').html(g_form.build('download_add', {
                    elements: {
                        fileName: {
                            title: '文件名',
                            value: getVal(opts.fileName),
                        },
                        url: {
                            title: '下载地址',
                            required: true,
                            value: getVal(opts.url),
                        },
                        pathName: {
                            title: '保存位置',
                            required: true,
                            value: getVal(opts.pathName, g_setting.getConfig('savePath'))
                        }
                        /*,
                        switch: {
                            title: '立即下载',
                            type: 'checkbox',
                            value: true,
                        }*/
                    },
                }))
                g_form.update('download_add')
            },
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    let vals = g_form.getVals('download_add')
                    let b = Object.keys(vals).length > 0
                    if (b) {
                        vals.title = vals.fileName
                        this.item_add(new Date().getTime(), vals)
                    }
                    return b
                }
            }
        })
    },
    // 添加url下载
    quickDownload(url, ext) {
        this.item_add(guid(), {
            url: url,
            fileName: guid() + '.' + ext
        })
    },
    config: {},

    // 启动aria2服务
    aria_start() {
        const self = this
        try {
            let conf = getConfig('aria2c_config')
            self.config = nodejs.require('ini').parse(nodejs.files.read(conf));
            // TODO 如果aria2c位置改变则重新启动aria
            self.aria2c = require('./aria2c.js')({
                path: getConfig('aria2c_path'),
                conf,
                config: {
                    port: self.config['rpc-listen-port'],
                }
            })
            self.aria2c
                .on('conect_success', () => {
                    console.info('连接aria2c成功')
                    self.aria2c
                        .setGlobalTasker(r => {
                            // ipc_send('progress', {val: progress, type: 'normal'})

                            let speed = renderSize(Number(r.downloadSpeed))
                            //document.title = `[${speed}]` + ((r.numActive != '0' ? r.numActive + '下载中 ' : '') + (r.numWaiting != '0' ? r.numWaiting + '队列中 ' : '') || ' 没有下载任务')
                            $('#badge_downloading').html(r.numActive).toggleClass('hide', r.numActive == '0')
                            $('#badge_downloadSpeed').html(`<i class="ti ti-arrow-big-down-line fs-2" style="vertical-align: sub;" ></i>${speed}`)

                            if (r.numActive == 0) {

                            }
                        }).
                    setItemUpdate((r, ids) => {
                        ids.forEach((id, i) => {
                            let { completedLength, totalLength } = r[i][0]
                            let progress = parseInt(Number(completedLength) / Number(totalLength) * 100)
                            self.item_getEle(id).find('progress').val(progress)
                        })
                    })

                    // self.quickDownload('http://127.0.0.1/1.mp4', 'mp4')
                })
                .on('conect_error', () => {
                    console.error('连接aria2c失败')
                })
                .on('addUri', v => {
                    // g_plugin.callEvent('addUri', v).then(v => {
                    //     self.data_set(v.id, Object.assign(v, {
                    //         date: new Date().getTime(),
                    //     }))
                    // })
                })
                .on('downloading', v => {
                    // 开始下载
                    self.item_update(v.id, 'downloading')
                    // 检测下载进度
                })
                .on('error', v => {
                    self.item_update(v.id, 'error')
                })
                .on('complete', v => {
                    self.item_complete(v.id)
                })
                .init()
        } catch (err) {
            alert(err.toString(), { title: '启动aria2失败', type: 'danger' })
        }

    },
    item_get(id) {
        return this.datas[id]
    },
    item_remove(id) {
        let d = this.item_get(id)
        this.item_getEle(id).remove()
        d.gid && this.aria2c.remove(d.gid).then(gid => {
            // 如果还在下载，则删除源文件和.aira
            let file = d.pathName + '/' + d.fileName
            nodejs.files.remove(file)
            nodejs.files.remove(file + '.aria2')
        })
        return this.data_set(id)
    },
    item_getList(status) {
        return Object.keys(this.status).filter(id => this.status[id] == status)
    },
    item_next() {
        let waiting = this.item_getList('waitting')
        if (waiting.length) {
            let downloading = this.item_getList('downloading')
            if (!downloading.length) {
                this.item_start(waiting[0])
            }
        }
    },
    item_start(id) {
        let d = this.item_get(id)
        if (d) {
            console.log('startDownload', d)
            this.item_update(id, 'preload')

            switch (d.type) {
                case 'media_fetch':
                    g_rule.url_parse(d.url, src => {
                        console.log(src)
                        if (getExtName(src).toLowerCase() == 'mp4') {
                            // aria2 下载
                            this.aria2c.addUris([d]);
                        } else {
                            // m3u8-cli 下载
                            // TODO 下载器自定义回调
                            //  
                            this.process.push(g_downloader.m3u8DL([src, '--workDir', d.pathName, '--saveName', getFileName(d.fileName, false)].join(' ') + ' ' + getConfig('m3u8Downloader_args', '--enableDelAfterDone --enableMuxFastStart --disableIntegrityCheck'), {
                                onOutput: msg => {
                                    console.log(msg)
                                    msg = msg.substr(13, msg.length - 13).replace('Progress: ', '').split("\r\n")[0].trim()
                                    if(msg == '下载失败,程序退出'){
                                        this.item_complete(id, 'error')
                                    }else
                                    if (msg == '任务结束') {
                                        this.item_complete(id)
                                    } else {
                                        this.item_update(id, msg)
                                    }
                                },
                                onError: (...args) => {
                                    console.log(args)
                                    this.item_update(id, 'error')
                                }
                            }, { shell: false, iconv: true }))
                        }
                    })
                    break;
            }
        }
    },
    item_add(id, opts) {
        if (isEmpty(id)) id = guid()
        if (!opts.pathName) opts.pathName = getConfig('savePath')
        if (!opts.fileName) opts.fileName = id + '.' + popString(opts.url, '.')
        g_plugin.callEvent('beforeaddDownload', { id, opts }).then(data => {
            console.log(data)
            let { id, opts } = data
            this.data_set(id, Object.assign(opts, {
                id,
                title: opts.fileName,
                date: new Date().getTime(),
                status: 'waitting',
            }))
        })
    },

    m3u8DL(cmd, events = {}, spawn = {}) {
        return nodejs.cli.run(nodejs.bin + '\\N_m3u8DL-CLI_v3.0.1.exe', cmd, spawn, events)
    },

    refresh() {
        $('#download_list').html(this.html_get())
        for (let id in this.datas) {
            let item = this.datas[id]
            if (item.finish || nodejs.files.exists(item.pathName + item.fileName)) {
                item.status = 'complete'
            } else {
                item.status = 'waitting'
            }
            this.item_update(id, item.status)
        }
    },
    item_complete(id, status = 'complete') {
        let item = this.item_get(id)
        if(status == 'complete'){
             item.finish = new Date().getTime()
            item.status = 'complete' // 保存
            this.data_save()
        }
        this.item_update(id, 'complete')
        setTimeout(() => this.item_next(), 3000)
    },
    status: {}, // 临时信息缓存
    item_update(id, t) {
        if (isEmpty(t)) return
        this.status[id] = t
        let c = 'primary',
            h = t
        switch (t) {
            case 'preload':
                c = 'info'
                h = '初始化中...'
                break;
            case 'waitting':
                c = 'warning'
                h = '队列中...'
                break;
            case 'downloading':
                h = `<progress class="progress progress-sm" value="0" max="100"/>`
                break;
            case 'error':
                c = 'danger'
                h = '下载错误'
                break;
            case 'complete':
                c = 'success'
                h = '下载完成'
                break;
        }
        let div = this.item_getEle(id)
        div.replaceClass('bg-', 'bg-' + c + '-lt').find('.status-dot').replaceClass('bg-', 'bg-' + c)
        div.find('div.d-block').html(h)
    },
    item_getEle(id) {
        return $('[data-download="' + id + '"]')
    },
    data_set(k, v, save = true) {
        if (v == undefined) {
            delete this.datas[k]
        } else {
            this.datas[k] = v
        }
        save && this.data_save()
        this.refresh()
        return this
    },
    data_save() {
        local_saveJson('downloads', this.datas)
    },
    html_get() {
        let h = ''
        for (let [id, item] of Object.entries(this.datas)) {
            let ext = popString(item.title, '.').toLowerCase()
            h += `
                <div class="list-group-item" data-download="${id}">
                  <div class="row align-items-center position-relative">
                    <div class="col-auto"><span class="status-dot bg-secondary d-block"></span></div>
                    <div class="col-auto">
                      <a href="#">
                        <i class="ti ti-${['mp4', 'mov', 'avi', 'flv'].includes(ext) ? 'movie' : ['jpg', 'png', 'jpeg'].includes(ext) ? 'photo' : 'file'} avatar fs-1"></i>
                      </a>
                    </div>
                    <div class="col text-truncate">
                      <a data-action="download_title_click" class="text-reset d-block">
                        ${item.category ? `<span class="badge bg-cyan-lt me-2">${item.category}</span>` : ''}
                        ${item.title}${item.size ? `(${renderSize(item.size)})` : ''}
                      </a>
                      <div class="d-block text-muted text-truncate mt-n1 p-2 text-nowarp">
                        查询信息中...
                      </div>
                    </div>
                    <div class="col-auto">
                      <a class="list-group-item-actions">
                        <i class="ti ti-folder" data-action="download_item_folder"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            `
        }
        return h || `
            <h3 class="p-2 text-center">没有任何下载记录...</h3>
        `
    },

}

g_downloader.init()