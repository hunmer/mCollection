var g_client = {
    url: 'ws://127.0.0.1:41594',
    init() {
        // g_cache.debug = true
        this.recon()
        loadRes([_dataPath + '\\resources\\app\\server\\tasker.js'])
    },
    setConnected(b) {
        // getEle('channel_startServer').toggleClass('hide', b);

        // let div = removeClass($('#badge_team_status'), 'bg-')
        //     .addClass('bg-' + (b ? 'success' : 'danger'))
        //     .find('b').html(b ? '连接成功' : '连接失败');
    },
    reloadServer(){
        if(this.isConnected()) this.send('exit')
        // TODO SOCKET回调函数
    },
    tryStartServer() {
        fetch('http://127.0.0.1:41597').then(response => response.json()).then(data => {
            if (data.status != 'success') {
                this.startSever()
            } else {
               

            }
        }).catch(error => {
            this.startSever()
        });
    },
    startSever() {
        let _path = __dirname + '\\server\\'
        // if(this.child) require('tree-kill')(this.child.pid, 'SIGKILL', () => console.log('已退出服务...'))
        // 随着刷新而刷新
        this.child = nodejs.cli.run(_path + 'node.exe', _path + 'server.js', {
            // detached: true
        }, {
            onOutput: function(msg) {
                console.log(msg)
            },
            onExit: () => {
                console.log('exit')
            }
        })
        // console.log(this.child)
    },
    recon(recon = true) {
        let self = this;
        self.reconnect && clearTimeout(self.reconnect);
        if (recon && this.reconable) {
            this.tryStartServer()
            self.reconnect = setTimeout(() => self.connect(), 1000)
        }
    },
    reconable: true,
    disconnect() {
        if (this.isConnected()) {
            this.reconable = false;
            this.connection.close();
        }
    },
    connect(url) {
        let self = this;
        if (self.connection) self.connection.close();
        let socket = self.connection = new WebSocket(url || this.url);
        socket.onopen = () => {
            if (!this.lastConnect) { // 初次连接

            }
            this.lastConnect = new Date().getTime()
            self.reconable = true;
            self.setConnected(true);
            self.recon(false);

            self.sendList.forEach(s => socket.send(s))
            self.sendList = []

            // 发送文件夹同步事务
            self.send('connected', {type: 'client'});
            self.ping && clearInterval(self.ping);
            self.ping = setInterval(() => self.send('ping'), 1000 * 30);
        }

        socket.onmessage = e => {
            self.onRevice(JSON.parse(e.data));
        }

        const onError = e => {
            self.setConnected(false);
            self.recon();
        }

        socket.onclose = e => onError(e);
    },

    revices: {

    },
    registerRevice: function(name, callback) {
        let isArr = Array.isArray(name)
        if (typeof(name) == 'object' && !isArr) {
            Object.assign(this.revices, name)
            return this
        }

        if (!isArr) name = [name];
        for (var alisa of name) this.revices[alisa] = callback;
        return this
    },
    // once(type, data, callback){
    //     this.send(type, data)
    //     this.registerRevice()
    // },

    onRevice(data) {
        debug('revice', data);
        let d = data.data;
        if (this.revices[data.type]) return this.revices[data.type](d);

        switch (data.type) {}
    },

    isConnected() {
        return this.connection && this.connection.readyState == 1;
    },

    sendList: [],
    send(type, data = {}) {
        if (typeof(type) == 'object') {
            data = type;
            type = data.type;
            delete data.type;
        }
        let r = {
            type: type,
            data: data,
        }
        debug('send', r);
        let s = JSON.stringify(r)
        if (!this.isConnected()) {
            this.sendList.push(s)
        } else {
            this.connection.send(s);
        }
    },



}

g_client.init();