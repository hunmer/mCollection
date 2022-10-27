g_data.init({

     getFolderVideos(folder = ''){
        return  g_data.all(`SELECT * FROM videos WHERE folder='${folder}'`)
    },

    // 插入数据
    data_addVideo(d) {
        return this.run(`INSERT INTO videos (folder, json, date, file, birthtime, size, deleted, md5) VALUES (@folder, @json, @date, @file, @birthtime, @size, @deleted, @md5)`, this.data_format(d))
    },

    // 插入数据
    data_addClip(d) {
        return this.run(`INSERT INTO clips (tags, title, folder, json, desc, md5, date, birthtime, score, size, ext, deleted) VALUES (@tags, @title, @folder, @json, @desc, @md5, @date, @birthtime, @score, @size, @ext, @deleted)`, this.data_format(d))
    },
    init() {
        const self = this
        g_fileDrop.register('videos', {
            selector: '#video_tabs',
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
            exts: ['mp4', 'ts', 'm3u8', 'flv', 'mdp'],
            onParse(r) {
                // TODO 专门处理目录拖动的窗口...
                for (let dir of r.dirs) {
                    nodejs.files.dirFiles(dir, this.exts, files => {
                        r.files = r.files.concat(files)
                    })
                }
                self.file_revice(r.files, false)
            }
        })

        self.db = g_db.db_switch(getConfig('db'))
        // setTimeout(() => this.tasker_updateCnt(), 2000)
    },


    timer_updateCnt: 0,
    // 更新过滤器的结果数
    tasker_updateCnt(start = true) {
        clearInterval(this.timer_updateCnt)
        // TODO 不止侧边（文件夹,tab也支持显示)
        if (start) {
            let fun = async () => {
                for (let [name, filter] of Object.entries(g_filter.presets)) {
                    // 试试暴力遍历法？
                    if (typeof(filter.onCntChange) == 'function') { // TODO 目录也支持显示，或者其他自定义
                        filter.onCntChange(await g_data.getLengths(filter.rule, filter.table))
                    }
                }
            }
            this.timer_updateCnt = setInterval(fun, 6000 * 10)
            fun()
        }
    },

    data_import(data) {
        data.forEach((item, i) => {
            data[i] = Object.assign({
                folder: '',
                birthtime: 0,
                size: 0,
                json: {},
                deleted: 0,
                md5: nodejs.files.getMd5(item.file),
                date: new Date().getTime()
            }, data[i])
        })

        g_data.data_insert(data, i => {

        }, added => {
           toast('成功添加'+added.length+'个文件', 'success')
        })
    },


    // 添加数据
    async data_insert(data, onProgress, onDone) {
        let self = this;
        let cnt = 0;
        let existed = [];
        let added = [];
        let max = Object.keys(data).length;
        for (let d of data) {
            let old = await g_data.data_get(d.md5)
            if (!old) {
                self.data_addVideo(d);
                added.push(d);
                // 不存在则创建目录
                let folder = d.folder
                if (!isEmpty(folder) && !g_folder.folder_exists(folder)) {
                    let opts = g_cache.folderPreset[folder]
                    if (!isEmpty(opts.parent)) { // 同时创建父目录
                        g_folder.folder_set(opts.parent, g_cache.folderPreset[opts.parent] || opts, false)
                    }
                    g_folder.folder_set(folder, opts, false)
                    g_folder.update(true)
                }
            }
            if (++cnt >= max) {
                // TODO 提示是否已存在文件的比较
                onDone && onDone(added)
            }
            onProgress && onProgress(cnt, d.md5)
            // g_datalist.progress_set(max, added.length, existed.length)
        }

    },
})