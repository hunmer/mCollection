var g_fileDrop = {
    list: {},
    init() {
        // 记录全局鼠标位置，辅助用
        window.addEventListener('mousemove', e => {
            g_cache.mouse = e
        })
        $(document).
        // 拖拽文件
        on('dragstart', '[data-file]', function(e) {
            clearEventBubble(e)
            g_cache.draging = true; // 全局拖拽事件，只允许外部文件触发filedrop
            let dom = $(e.currentTarget)
            let icon = dom.attr('data-icon') || dom.attr('src') || dom.find('img').attr('src')
            let files = [dom.attr('data-file')]
            let keys = [dom.attr('data-md5')]
            for (let target of dom.siblings('.item_selected')) {
                let { file, md5 } = target.dataset
                files.push(file)
                md5 != undefined && keys.push(md5)
            }
            g_cache.dragingMD5s = keys
            setDragingFiles(files, icon)
        })
        // 不知道啥原因不会触发,不取消dargstart且不会出现拖拽元素??
        // on('dragend', '[data-file]', function(e) {
        //     console.log('end', e)
        //     g_cache.draging = false;
        // })


    },
    register(name, opts) {
        const self = this
        this.list[name] = opts

        if (opts.layout) {
            $(`<div class="filedrop_layout" id="filedrop_layout_${name}" style="
                    position: fixed;
                    z-index: 99999;
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    pointer-events: none;
                    display: none;
                ">
                ${opts.layout}
            </div>
            `).appendTo('body')
        }

        const fileDragHover = function(e) {
            if (g_cache.draging) return; // 忽略从软件拖动的文件

            let { target, type } = e
            target = $(target)
            let show = true
            if (type == 'dragleave') {
                show = inArea(e, $(opts.selector)) // 范围之内
            }

            self.getLayout(name).toggleClass('show', show)
            opts.onUpdateTarget && opts.onUpdateTarget(e)
            clearEventBubble(e)
        }

        $(window).on('blur', event => {
            g_cache.draging = false;
        })

        let lastDragTime

        $(document).
        on('dragleave', opts.selector, e => fileDragHover(e)).
        on('dragover', opts.selector, e => fileDragHover(e)).
        on('drop', opts.selector, function(e) {
            self.hideAll()
            e = e.originalEvent;
            self.parseFiles(name, e.target.files || e.dataTransfer.files);
            delete g_cache.dragingFile;
            g_cache.draging = false;
            clearEventBubble(e)
        })
    },
    getLayout(name) {
        return $('#filedrop_layout_' + name)
    },
    getShowing() {
        return $(".filedrop_layout.show")
    },
    hideAll() {
        this.getShowing().removeClass('show')
    },
    remove(name) {
        delete this.list[name]
    },
    get(name) {
        return this.list[name]
    },
    parseFiles(name, files) {
        let d = this.get(name)
        let r = { dirs: [], files: [] }
        for (let i = 0, f; f = files[i]; i++) {
            if (f.path) { // 从electron接受文件
                if (nodejs.files.isDir(f.path)) { // 目录
                    r.dirs.push(f.path)
                    continue;
                }
                f.file = f.path
            }
            let ext = f.name.split('.').pop().toLowerCase();
            if (d.exts.includes(ext) && !(g_cache.dragingFile && g_cache.dragingFile.includes(f.path))) {
                r.files.push(f.file)
            }
        }
        d.onParse && d.onParse(r)
    },

    revicePath(path, files) {
        let i = g_cache.paths.indexOf(path);
        if (i != -1) {
            g_cache.paths.splice(i, 1);
            for (let file of files) {
                if (!g_cache.files.includes(file)) {
                    g_cache.files.push(file);
                }
            }
            if (g_cache.paths.length == 0) {
                g_video.reviceFiles(g_cache.files, popString(path, '\\'));
            }
        }
    },
}

function setDragingFiles(files, icon) {
    g_cache.dragingFile = files
    ipc_send('ondragstart', {
        files: files.map(file => file.replace('./', __dirname + '/')),
        icon: (icon || '').replace('file:///', '').replace('./', __dirname + '/'),
    });
}