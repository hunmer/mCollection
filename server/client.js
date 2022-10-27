var g_client = {
    url: 'ws://127.0.0.1:41594',
    init() {
       this.connect()
       loadRes([_dataPath+'\\resources\\app\\server\\tasker.js'])
    },
    setConnected(b) {
        // getEle('channel_startServer').toggleClass('hide', b);

        // let div = removeClass($('#badge_team_status'), 'bg-')
        //     .addClass('bg-' + (b ? 'success' : 'danger'))
        //     .find('b').html(b ? '连接成功' : '连接失败');
    },
    recon(recon = true) {
        let self = this;
        self.reconnect && clearTimeout(self.reconnect);
        if (recon && this.reconable) {
            self.reconnect = setTimeout(() => self.connect(), 1000 * 3)
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
            if(!this.lastConnect){ // 初次连接
            }
            this.lastConnect = new Date().getTime()
            self.reconable = true;
            self.setConnected(true);
            self.recon(false);

            self.sendList.forEach(s => socket.send(s))
            self.sendList = []

            // 发送文件夹同步事务
            // self.send('login');

            // self.ping && clearInterval(self.ping);
            // self.ping = setInterval(() => socket.send('ping'), 1000 * 30);
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
        }else{
            this.connection.send(s);
        }
    },

   

}

g_client.init();
