var g_fw = {
    list: {},
    init() {
        this.chokidar = require('chokidar');
    },

    register(name, opts) {
        this.list[name] = Object.assign({
            options: {},
            onError() {},
            onReady() {},
            onChange() {},
        }, opts)
        this.watcher_init(name)
    },

    get(name) {
        return this.list[name]
    },

    unregister(name) {
        this.watcher_stop(name)
        delete this.list[name]
    },

    watcher_get(name) {
        return this.list[name].watcher
    },

    watcher_init(name) {
        // this.watcher_get(name) && this.watcher_stop(name)
        // toArr(opts.target).map(path => path.replaceAll('\\', '//'))
        let opts = this.get(name)
        // BUG: 数组目录没反应只能这样了
        this.list[name].watcher = toArr(opts.target).map(path => {
            let watcher = this.chokidar.watch(path.replaceAll('\\', '//'), Object.assign({
                ignored: /(^|[\/\\])\../, // ignore dotfiles
                // ignored: /node_modules|\.git/,
                persistent: true
            }, opts.options));
            // const log = console.log.bind(console);
            // watcher
            //   .on('add', path => log(`File ${path} has been added`))
            //   .on('change', path => log(`File ${path} has been changed`))
            //   .on('unlink', path => log(`File ${path} has been removed`));
            watcher
                // .on('addDir', path => log(`Directory ${path} has been added`))
                // .on('unlinkDir', path => log(`Directory ${path} has been removed`))
                .on('error', opts.onError)
                .on('ready', opts.onReady) // 初次调整完成
                .on('change', opts.onChange);
            return watcher
        })
    },

    watcher_stop(name) {
        let watcher = this.watcher_get(name)
        watcher && watcher.forEach(inst => inst.close().then(() => console.log('closed')))
    },

}

g_fw.init()