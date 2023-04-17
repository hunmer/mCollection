g_data.init({
    // 插入数据
    data_add(d) {
        return this.data_setData(d)
    },
    init() {
        g_fileDrop.register('datalist', {
            selector: '#content',
            // TODO 多个div 根据放置的位置执行操作(当前文件夹,全部,复制，裁剪等...)
            layout: `
                <div class="w-max h-max d-flex align-items-center justify-content-center" style="background-color: rgba(0, 0, 0, .7)">
                    <div class="bg-light p-2 border rounded-3 row align-items-center text-center" style="height: 30vh;width: 50vw;">
                      <div class="col-12">
                        <i class="ti ti-file-import text-muted" style="font-size: 8rem" ></i>
                      </div>
                      <h3 class="col-12 text-muted">
                        导入文件到数据库
                      </h3>
                    </div>
                </div>
            `,
            exts: g_format.getFormats(),
            async onParse(r) {
                // TODO 专门处理目录拖动的窗口...
                for (let dir of r.dirs) {
                    r.files.push(...await nodejs.files.dirFiles(dir, this.exts))
                }
                g_data.file_preRevice(r.files)
            }
        })
        $(() => {
            this.db = g_db.db_switch(getConfig('db'))
        });
    },
    file_preRevice(files) {
        console.log(files)
        let onClose = () => g_modal.remove('progress_beforeImport')
        if (!files.length) return
        let progress = new Progress('beforeImport', {
            datas: files,
            logText: '<p><b class="text-success">√ 成功解析:</b>\n<b>%%s%%</b></p>',
            onProgress: i => i >= 100 && onClose(),
            onClose
        }).build(html => {
            alert(html, {
                id: 'progress_beforeImport',
                title: '解析媒体中...',
                btn_ok: '取消',
                scrollable: true,
            }).then(() => {
                progress.destroy()
                if (progress.val < 100) {
                    // 取消
                }
            })
        })
        g_data.file_revice(files, true, item => {
            progress.setSloved(item.file)
        })
    },
    
    data_import(data) {
        console.log(data)
        // todo 在这里把data缺少的参数补上
        // 能否接受数组参数？外部计算md5不方便
        return new Promise(reslove => {

            for (let k in data) {
                data[k] = Object.assign({
                    link: '',
                    title: '',
                    birthtime: 0,
                    size: 0,
                    deleted: 0,
                    json: {},
                    date: new Date().getTime()
                }, data[k])
            }

            this.data_insert(data, i => {

            }, added => {
                // TODO判断是否符合当前过滤器
                if (added.length) g_datalist.tab_loadItems(added, g_datalist.getCurrentTab(), 'prependTo')
                reslove(added)
            })
        })

    },

    // 添加数据
    async data_insert(data, onProgress, onDone) {
        let self = this;
        let cnt = 0;
        let existed = [];
        let added = [];
        let max = Object.keys(data).length;

        // TODO 导入完成后弹出错误信息
        // TODO 占位元素
        // 复制和移动操作很长， 允许取消

        let type = getConfig('importType', 'copy')
        const { exists, getFileName } = nodejs.files
        for (let md5 in data) {
            let d = data[md5]
            d.md5 = md5

            let next = () => {
                if (++cnt >= max) {
                    // TODO 提示是否已存在文件的比较
                    onDone && onDone(added)
                }
                onProgress && onProgress(cnt, md5, saveTo)
                g_datalist.progress_set(max, added.length, existed.length)
            }

            let fileName = getFileName(d.file)
            let saveTo = g_db.getSaveTo(md5) + fileName
            d.title = getFileName(fileName, true)

            // TODO 只获取物品的一部分属性
            let old = await g_data.data_get(md5)
            if (old) { // 已存在
                if (exists(old.link) || exists(saveTo)) { // 不是链接文件且文件不存在
                    existed.push(md5);
                    next()
                    continue
                }
            }

            let fun = k => {
                let d = data[k];
                self.data_add(d);
                added.push(d);

                // 不存在则创建目录
                d.folders && d.folders.forEach(folder => {
                    if (!g_folder.folder_exists(folder)) {
                        let opts = g_cache.folderPreset[folder]
                        if (!isEmpty(opts.parent)) { // 同时创建父目录
                            g_folder.folder_set(opts.parent, g_cache.folderPreset[opts.parent] || opts, false)
                        }
                        g_folder.folder_set(folder, opts, false)
                        g_folder.update(true)
                    }
                })
                next();
            }


            switch (type) {
                case 'copy':
                case 'move':
                    g_tasker.task_add(type + '_' + md5, {
                        type,
                        saveTo,
                        file: d.file,
                        md5
                    }, {
                        onComplete: ret => {
                            //nodejs.files.exists(ret.saveTo)
                            if (ret.err == undefined) {
                                fun(ret.md5)
                            }
                        }
                    })
                    break;

                case 'link':
                    d.json.file = d.file // 标注目标文件
                    fun(md5)
                    break;
            }
        }

    },
})