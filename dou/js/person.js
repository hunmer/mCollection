var g_person = {
    // api: 'http://127.0.0.1/dou/',
    api: 'https://neysummer-api.glitch.me/',
    init() {
        const self = this
        g_action.registerAction({
            person_user: () => self.modal_user(),
        })

        g_setting.onSetConfig('user', ({ icon }) => {
            $('#person_div img').attr('src', icon)
        })

    },

    get() {
        return getConfig('user')
    },

    me(){
        return this.get().name
    },

    set(data) {
        delete data.type
        setConfig('user', data)
    },

    check() {
        let d = this.get()
        if (!d) {
            this.modal_user()
            return false
        }
        return true
    },

    modal_user() {
        let d = this.get() || {
            id: '',
            name: ''
        }
        g_form.confirm('person_edit', {
            elements: {
                icon: {
                    title: '图标',
                    type: 'image',
                    value: __dirname + '\\user.jpg',
                },
                id: {
                    title: '账号',
                    value: d.id,
                    require: true,
                },
                name: {
                    title: '名称',
                    value: d.name,
                },
            },
        }, {
            id: 'person_edit',
            title: '用户设置',
            btn_ok: '保存',
            once: true,
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    // TODO 上传头像
                    toast('上传中...')
                    let params = g_form.getVals('person_edit')
                    let saveTo = __dirname + '\\user.jpg'
                    if (!params.icon.startsWith('http')) {
                        params.icon = params.icon.replace('file:///', '')
                        nodejs.files.write(saveTo, nodejs.files.readFile(params.icon))
                        params.icon = nodejs.files.getImageBase64(params.icon)
                    } else {
                        // 下载文件
                        downloadFile({
                            url: params.icon,
                            saveTo,
                            onComplete(file) {},
                            onError(err) {
                                toast('保存图片失败', 'danger')
                            }
                        })
                    }
                    params.type = 'profile'
                    this.request(params, data => {
                        toast(data.msg, data.code == 'ok' ? 'success' : 'danger')
                        delete params.icon
                        g_person.set(params)
                    })
                }
            }
        })
    },

    request(params, callback, api = 'dou.php') {
        let d = this.get()
        if (d) {
            if (params.id == undefined) params.id = d.id
            if (params.name == undefined) params.name = d.name
        }
        $.ajax({
            url: this.api + api + '?t=' + (new Date().getTime()) ,
            data: params,
            type: 'POST',
            dataType: 'json',
            beforeSend: function(request) {
                request.setRequestHeader("cache-control", "no-cache");
            },
            success: function(data) {
                try {
                    data = JSON.parse(data)
                } catch (e) {

                }
                callback(data)
            }
        })
    }
}

g_person.init()