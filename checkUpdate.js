let g_update = {
    needUpdates: [],
    init() {
        const self = this
        g_setting.setDefault('updateURL', 'https://raw.githubusercontent.com/hunmer/mCollection/main/')
        g_action.
        registerAction('update_check', dom => {
            if (self.needUpdates.length) return self.showUpdates()
            this.checkUpdate(getConfig('updateURL'))
        })
        $(() => {
            setTimeout(() => self.checkUpdate(getConfig('updateURL'), false), 2000)
        });
    },

    checkUpdate(url, tip = true) {
        let skip = [];
        this.updateing = true
        
        fetchURL(url + 'listFile.json', json => {
            let list = {};
            let i = 0
            for (let n of Object.keys(json).filter(name => {
                 let md5 = json[name]
                    name = name.replace(/\\/g, "/");
                    if (skip.includes(name)) return false;

                    let saveTo = __dirname + '/' + name;
                    if (nodejs.files.exists(saveTo) && md5 == nodejs.files.getFileMd5(saveTo)) return false;
                    return true;
                })) {
                list[n.replace(/\\/g, "/")] = json[n]
                i++
            }
           
        }, () => toast('更新失败', 'danger'), () => delete this.updateing)
    },

    showUpdates(files, url) {
        if (!files) files = this.needUpdates;
        if (!url) url = getConfig('updateURL')
        let i = 0
        let h = ''
        for (let [file, md5] of Object.entries(files)) {
            h += `
                <a class="list-group-item" data-url="${url+file}">
                    ${file}
                </a>
            `
            i++
        }

        confirm(i ? `
            <div class="list-group list-group-flush overflow-y-auto" style="max-height: calca(100vh - 300px)">
                ${h}
            </div>
        ` : `<h4 class="text-center">没有文件需要更新...</h4>`, {
            title: i + '个文件需要更新',
            scrollable: true,
            btn_ok: '更新',
        }).then(() => {
            let progress = new Progress('update', {
                datas: files,
                autoClose: false,
                logText: '<p>√ 成功下载: %%s%%</p>',
                onProgress: i => {
                    if (i >= 100) {
                        g_modal.modal_get('progress_update').find('#btn_ok').html('完成')
                    }
                },
                onClose: function() {
                    g_modal.remove('progress_update')
                }
            }).build(html => {
                alert(html, {
                    id: 'progress_update',
                    title: '更新文件中...',
                    btn_ok: '取消',
                }).then(() => {
                    progress.destroy()
                    if (progress.val >= 100) {
                        location.reload()
                    }
                })
            })

            let url = getConfig('updateURL')
            let err = 0
            let i = -1;
            const next = () => {
                let name = Object.keys(files)[++i]
                if (name != undefined) {
                    // let md5 = files[name]
                    // todo 下载完成后md5检查
                    downloadFile({
                        url: url + name,
                        saveTo: __dirname + '\\' + name,
                        onError: () => ++err,
                        complete: (u, s) => {
                            progress.setSloved(u)
                            next();
                        }
                    });
                }
            }
            next()
        })
    },

}

g_update.init()