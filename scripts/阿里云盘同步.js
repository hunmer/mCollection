// ==UserScript==
// @name    阿里云盘同步
// @version    1.0
// @author    hunmer
// @description    把数据库合并到阿里云盘
// @namespace    a472a79d-bb64-4a5e-918f-d1d3e1e067b5

// ==/UserScript==


/*

{
    "drive_id": "408429",
    "domain_id": "bj29",
    "file_id": "626982a19e418cfb11e8492497e907c39e713bc3",
    "name": "分享",
    "type": "folder",
    "created_at": "2022-04-27T17:51:29.694Z",
    "updated_at": "2022-04-27T17:51:36.190Z",
    "hidden": false,
    "starred": false,
    "status": "available",
    "parent_file_id": "root",
    "encrypt_mode": "none"
}

{
    "drive_id": "408429",
    "domain_id": "bj29",
    "file_id": "63930be0a41f19ba01f841fabf67a86d908ee93a",
    "name": "HITTEST_32088110.tmp",
    "type": "file",
    "created_at": "2022-12-09T10:20:16.082Z",
    "updated_at": "2022-12-09T10:20:16.082Z",
    "file_extension": "tmp",
    "mime_type": "text/plain; charset=utf-8",
    "mime_extension": "txt",
    "hidden": false,
    "size": 0,
    "starred": false,
    "status": "available",
    "parent_file_id": "root",
    "content_hash": "DA39A3EE5E6B4B0D3255BFEF95601890AFD80709",
    "content_hash_name": "sha1",
    "category": "others",
    "encrypt_mode": "none",
    "punish_flag": 0,
    "revision_version": 1
}


*/


  
var g_aliyun = {

    init() {
        const self = this
        self.config = getConfig('aliyun_config', {
            token: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFlMzYzMGE3YjE0NjY2OTI3YjJjNWI3OTBmMzBlNiIsImN1c3RvbUpzb24iOiJ7XCJjbGllbnRJZFwiOlwiMjVkelgzdmJZcWt0Vnh5WFwiLFwiZG9tYWluSWRcIjpcImJqMjlcIixcInNjb3BlXCI6W1wiRFJJVkUuQUxMXCIsXCJTSEFSRS5BTExcIixcIkZJTEUuQUxMXCIsXCJVU0VSLkFMTFwiLFwiVklFVy5BTExcIixcIlNUT1JBR0UuQUxMXCIsXCJTVE9SQUdFRklMRS5MSVNUXCIsXCJCQVRDSFwiLFwiT0FVVEguQUxMXCIsXCJJTUFHRS5BTExcIixcIklOVklURS5BTExcIixcIkFDQ09VTlQuQUxMXCIsXCJTWU5DTUFQUElORy5MSVNUXCIsXCJTWU5DTUFQUElORy5ERUxFVEVcIl0sXCJyb2xlXCI6XCJ1c2VyXCIsXCJyZWZcIjpcImh0dHBzOi8vd3d3LmFsaXl1bmRyaXZlLmNvbS9cIixcImRldmljZV9pZFwiOlwiOGYwMjg2MWEzOTQ0NGEyYzhkNjNhOTEzMGQ0NzM1OTFcIn0iLCJleHAiOjE2ODQ0NjUyNTIsImlhdCI6MTY4NDQ1Nzk5Mn0.BEnRbi8-0h_EzBOwUsWSDuq3yCl8jnm5ngSaJqgGPZDre0Inzlj0ersnSoRotlmXWp83R3JhFGDuvAspbecegqwq-7hLjQvBfq28lBzpXl0wsJ5ylazx54xNr9W0yZOAlzipwgGKl-5TdeunfU3h2GYaT4eI2wvO1xtyB-lryzs`,
        })
        self.db = {
            dir_fid: '64673a9246115b7419e648f4be4dc24ef8cf9244',
            dir_path: '/LIAOYANJIE/影视.library/',
        }

        // 更改封面路径
        Object.assign(g_item.item_types.cover, {
            initFile: async args => {
                let path = 'resource://cover/'+args.data.md5
              
                args.cover = path
            },
            getFile: args => args.cover
        })

        // 更改文件路径
        Object.assign(g_item.item_types.file, {
            initFile: args => {
                let { md5, title } = args.data
                // console.log('file', md5, title)
                args.file = title
            },
            getFile: args => args.file
        })

        nodejs.remote.session.defaultSession.protocol.uninterceptProtocol('resource')
        nodejs.remote.session.defaultSession.protocol.interceptHttpProtocol('resource', async (request, callback) => {
            let args = decodeURI(request.url.slice('resource://'.length)).split('/')
            let [type, md5] = args
            
            let path = 'files/'
            let { title, id } = await g_data.data_get(md5)
            let folder = (await g_detail.inst.folders.get(id))[0]
            folder = folder != undefined ?  _getFolersPath(folder, '/') + '/' : ''
            path += folder + getFileName(title)

            let saveTo
            switch(type){
                case 'cover':
                    saveTo = g_db.opts.path + '/cover/' + folder.replaceAll('/', '/') + getFileName(title, false) + '.jpg' // cover
                    console.log({path, saveTo})
                    if(!nodejs.files.exists(saveTo)){
                        // return
                        return this.file_getThumb(path).then(url => {
                            console.log(url)
                            callback({url})
                            // netRequest({
                            //     url,
                            //     headers: {
                            //         "Referer": "https://www.aliyundrive.com/",
                            //         "Referrer-Policy": "origin"
                            //     },
                            // }).then(resp => resp.buffer()).then(raw => {
                            //     console.log(raw)
                            //     nodejs.files.write(saveTo, raw)
                            //     // callback({path: saveTo})
                            // })
                            //  downloadFile({
                            //     url,
                            //     saveTo,
                            //     headers: g_aliyun.http_getHeaders({
                            //         'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                            //         'Accept-Encoding': 'gzip, deflate, br',
                            //         'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                            //         'Connection': 'keep-alive',
                            //         'Host': 'cn-beijing-data.aliyundrive.net',
                            //         'Referer': 'https://www.aliyundrive.com/',
                            //         'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
                            //         'sec-ch-ua-mobile': '?0',
                            //         'sec-ch-ua-platform': '"Windows"',
                            //         'Sec-Fetch-Dest': 'image',
                            //         'Sec-Fetch-Mode': 'no-cors',
                            //         'Sec-Fetch-Site': 'cross-site',
                            //         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML,like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42',
                            //     }),
                            //     complete: () => callback({path: saveTo})
                            // })
                        })
                    }
                    break;  
            }

            // callback(saveTo)
            // callback({url: 'http://127.0.0.1/screenshot.png'})
            // callback({path: _dataPath+'screenshot1.png'})
        })

        // 64670f427e08d46dc29c43c694ae69c2a5ddb789

        // nodejs.files.dirFiles("I:/software/test/test", [], list => console.log(list.map(file => { return { file, hash: nodejs.files.getFileMd5(file, 'sha1') } })))

        // this.file_list_hash('6396d49a4a6530e634554e9dabee398801d71497', {
        //     items: [],
        //     paths: []
        // }, result => {
        //     console.log(result)
        //     console.log(result.items.length)
        // })

        // this.get().then(ok => {
        //     if(!ok) return
        //     this.file_selector().then(path => console.log(path))
        // })


        // this.initDir()
    },

    file_getThumb(path){
        return new Promise(reslove => {
            g_aliyun.file_getByPath(this.db.dir_path+path).then(item => {
                console.log(item)
                reslove(item.thumbnail.replace('&x-oss-additional-headers=referer', ''))
            })
        })
    },

    file_getURL(){

    },

    // 初次加载目录结构
    initDir() {
        let { dir_fid } = this.db
        let ret = {}
        let mgr = new Queue('aliyun_fileList', {
            max: 1,
            interval: 5000,
            title: '获取阿里云文件列表',
            onUpdate: ({ waittings, runnings }) => {
                if (waittings.length == runnings.length) {
                    console.log('done')
                    console.log(ret)
                    mgr.destroy()
                }
            },
        })

        let i = 0
        this.file_list_hash({ parent_file_id: dir_fid }, ret, items => {
            console.log(items)
        }, doRequest => {
            mgr.add(i++, {
                onStatusChange(status, cb) {
                    if (status == TASK_RUNNING) {
                        doRequest().then(() => cb(TASK_COMPLETED))
                    }
                }
            })
        })
    },
    path_list: {},

    // 获取目录下所有文件的hash
    async file_list_hash(opts, ...args) {
        let newst = []
        let [ret, onProgress, addRequest] = args
        return this.file_list(opts).then(list => {
            if (!list.items) {
                console.warn('获取目录文件失败...将会重试')
                return addRequest(() => this.file_list_hash.call(this, opts, ...args))
            }
            list.items.forEach(item => {
                let { file_id, content_hash: hash, name, parent_file_id, type } = item
                if (type == 'folder') {
                    this.path_list[file_id] = { name }
                    addRequest(() => {
                        console.info('开始查询文件夹： ' + name)
                        this.file_list_hash.call(this, { ...opts, marker: '', parent_file_id: file_id }, ...args)
                    })
                } else {
                    let data = { name, hash, file_id, parent_file_id }
                    ret[file_id] = data
                    newst.push(data)
                }
            })
            onProgress && onProgress(newst)
            if (list.next_marker) { // 下页数据
                opts.marker = list.next_marker
                addRequest(() => this.file_list_hash.call(this, opts, ...args))
            }
        })
    },

    setConfig(opts) {
        setConfig('aliyun_config', Object.assign(this.config, opts))
    },

    file_getByPath(file_path) {
        let {sign, device_id} = this.config
        return this.http({
            url: 'https://api.aliyundrive.com/v2/file/get_by_path',
            type: 'POST',
            postData: {
                drive_id: this.config.drive_id,
                file_path
                // "file_path": "/备份助手-2.4.exe",
                // "file_path": "/LIAOYANJIE/影视/",
            },
            headers: {
                'x-device-id': device_id,
                'x-signature': sign
            }
        })
    },

    file_selector() {
        const self = this
        return new Promise(async reslove => {
            let ret = await this.file_list()
            g_form.confirm1({
                id: 'al_file_selector',
                elements: {
                    tree: {
                        title: '目录树',
                        type: 'breadcrumb',
                        defaultPreset: {
                            list: [],
                            parents: [],
                            parseItem: (item) => {
                                let { name, type, updated_at, parent_file_id, file_id } = item
                                return `
                                <p>
                                    <i class="ti ti-${type} me-2"></i>
                                    <a href="#" data-action="form_breadcrumb_bread" data-value="${file_id}">${name}</a>
                                </p>`
                            },
                            getItem(fid) {
                                return this.list.find(({ file_id }) => file_id == fid)
                            },
                            getItemTitle(id) {
                                return this.getItem()?.title ?? this.parents[id] ?? id
                            },
                            getParents(list, id, self = false) {
                                return Object.keys(this.parents)
                            },
                            getChildItems(list, id) {
                                return [...list]
                            },
                            async onSelectedItem({ dom, item }) {
                                let paths = {};
                                let fid = dom.dataset.value
                                let isRoot = fid == '...'
                                if (!isRoot) {
                                    let selected = item.list.find(({ file_id }) => file_id == fid)
                                    if (!selected) { // 面包栏的不在列表里
                                        selected = { type: 'folder' }
                                    } else
                                        if (selected.type == 'file') { // 选中文件
                                            return true
                                        }

                                    (await self.file_getParents(fid)).items.reverse().forEach(_item => {
                                        let { file_id, name } = _item
                                        if (_item.type == 'file') { // 有一个是当前文件
                                            // content_hash download_url file_extension size thumbnail
                                        } else {
                                            paths[file_id] = name
                                        }
                                    })
                                }
                                item.preset.parents = paths

                                let ret = await self.file_list(isRoot ? {} : { parent_file_id: fid })
                                if (!ret.items) return

                                item.list = ret.items
                                item.next = ret.next_marker
                                g_form.rebuildElement("al_file_selector", 'tree')
                                return false
                            },
                        },
                        list: ret.items || [],
                        next: ret.next_marker,
                        value: '',
                    }
                },
                callback({ vals }) {
                    console.log(vals)
                }
            }, { width: '80%' })
        })
    },

    file_get(file_id) {
        return this.http({
            url: 'https://api.aliyundrive.com/v2/file/get',
            type: 'POST',
            postData: {
                drive_id: this.config.drive_id,
                file_id
            },
        })
    },

    file_getParents(file_id) {
        return this.http({
            url: 'https://api.aliyundrive.com/adrive/v1/file/get_path',
            type: 'POST',
            postData: {
                drive_id: this.config.drive_id,
                file_id
            },
        })
    },

    file_list(opts = {}) {
        return this.http({
            url: 'https://api.aliyundrive.com/adrive/v3/file/list',
            type: 'POST',
            postData: Object.assign({
                drive_id: this.config.drive_id,
                parent_file_id: "root",
                limit: 100,
                all: false,
                url_expire_sec: 14400,
                image_thumbnail_process: "image/resize,w_256/format,jpeg",
                image_url_process: "image/resize,w_1920/format,jpeg/interlace,1",
                video_thumbnail_process: "video/snapshot,t_1000,f_jpg,ar_auto,w_256",
                fields: "*",
                order_by: "updated_at",
                order_direction: "DESC"
            }, opts),
        })
    },

    get() {
        return new Promise(reslove => {
            this.http({
                url: 'https://api.aliyundrive.com/adrive/v2/user/get',
                type: 'POST',
                postData: {},
            }).then(data => {
                let { avatar, default_drive_id: drive_id, nick_name, phone, user_id } = data
                this.setConfig({ avatar, drive_id, nick_name, phone, user_id })

                if (!drive_id) { // 过期的token
                    this.show()
                    reslove(false)
                }

                if (this.win) { // 存在登录窗口
                    this.win.close()
                    this.win.destroy()
                    delete this.win
                }
                reslove(true)

            })
        })
    },

    show(cb) {
        if(this.win) return
        let win = this.win = new nodejs.remote.BrowserWindow({
            title: '阿里云盘',
            width: 1450,
            height: 970,
            webPreferences: {
                spellcheck: false,
                nodeIntegration: true,
                contextIsolation: true,
            }
        })
        // TODO 做个全局接口
        let setListener = nodejs.session.defaultSession.webRequest.onBeforeSendHeaders
        setListener({ urls: ['*://*/*'] }, (details, callback) => {
            let {requestHeaders} = details
            let token = requestHeaders['Authorization'] 
            let sign = requestHeaders['x-signature'] 
            if (!isEmpty(token) && !isEmpty(sign)) {
                this.setConfig({ token, sign, device_id: requestHeaders['x-device-id'] })
                setListener(null)
                cb && this.get().then(ok => ok && cb())
            }
            callback({cancel: false});
        })
        win.loadURL('https://www.aliyundrive.com/sign/in?spm=aliyundrive.index.0.0.2d8310110DQn6S', { userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36 Edg/103.0.1264.71' })
    },

    http_getHeaders(headers = {}){
        let {token, drive_id, sign} = this.config
        return {
            ...{
                'authorization': token,
                'x-device-id': drive_id,
                "x-signature": sign,
                "referer": "https://www.aliyundrive.com",
                'origin': 'https://www.aliyundrive.com',
            }, ...headers}
    },

    // 网络请求
    http(opts) {
        return new Promise(async _reslove => {
            const reslove = data => {
                console.log(data)
                if (data.code == "AccessTokenInvalid") { // token过期
                    return this.show(() => this.http(opts))
                }
                _reslove(data)
            }
            let http = {
                url: opts.url,
                type: opts.method ?? 'POST',
                headers: this.http_getHeaders(opts.headers),
                contentType: 'application/json;charset=utf-8',
                success: reslove,
                error: ({ responseJSON }) => reslove(responseJSON),
            }
            if (opts.method == 'GET') {
                http.url += '?' + Object.entries(opts.postData).map(([name, value]) => name + '=' + value).join('&')
            } else {
                http.data = JSON.stringify(opts.postData)
            }
            $.ajax(http);
        })
    },

}
g_aliyun.init()
