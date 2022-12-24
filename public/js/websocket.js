class _WebSocket {
    constructor(url, opts) {
        this.url = url
        this.opts = opts
        this.revices = {}
        this.sendList = []
        this.init()
    }
    init() {
        this.recon()
    }
    recon(recon = true) {
        this.reconnect && clearTimeout(this.reconnect);
        if (!this.isConnected() && recon) {
            this.reconnect = setTimeout(() => this.connect(), 2000)
        }
    }

    connect() {
        let self = this;
        if (self.connection) self.connection.close();
        
        let socket = self.connection = new WebSocket(self.url);
        socket.onopen = () => {
            self.recon(false);

            if (!self.lastConnect) { // 初次连接
                self.callEvent('onFirstConnected', true);
            }
            self.lastConnect = new Date().getTime()
            self.callEvent('onStateChanged', true);

            self.sendList.forEach(s => socket.send(s))
            self.sendList = []

            if (self.opts.ping) {
                self.ping = setInterval(() => self.send('ping'), self.opts.ping);
            }
        }

        socket.onmessage = e => {
            self.onRevice(JSON.parse(e.data));
        }

        socket.onclose = e => {
            self.callEvent('onStateChanged', false);
            self.recon();
            if (self.ping) {
                clearInterval(self.ping)
                delete opts.ping
            }
        }
    }

    callEvent(eventName, ...args) {
        if (this.opts[eventName]) {
            this.opts[eventName].apply(this, args)
        }
    }

    registerRevice(name, callback) {
        let isArr = Array.isArray(name)
        if (typeof(name) == 'object' && !isArr) {
            Object.assign(this.revices, name)
            return this
        }

        if (!isArr) name = [name];
        for (var alisa of name) this.revices[alisa] = callback;
        return this
    }

    onRevice(data) {
        debug('revice', data);
        let d = data.data;
        if (this.revices[data.type]) return this.revices[data.type](d);
        switch (data.type) {

        }
    }

    isConnected() {
        return this.connection && this.connection.readyState == 1;
    }

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
        this.opts.onBeforeSend(r)

        debug('send', r);
        let s = JSON.stringify(r)
        if (!this.isConnected()) {
            this.sendList.push(s)
        } else {
            this.connection.send(s);
        }
    }
}