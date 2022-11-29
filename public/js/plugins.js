let g_plugin = {
    events: {},
    defaultPlugins: {},
    instance: {},

    // 重置插件
    resetAll() {
        // nodejs.files.removeDir(this.getSciptPath());
        this.resetPlugins()
        setTimeout(() => location.reload(), 1000)
    },

    getSciptPath() {
        return _dataPath + "/scripts/"
    },

    // 初始化插件列表
    resetPlugins(reload = true) {
        this.list = copyObj(this.defaultPlugins);
        // this.setItem(guid(), {
        //     //title=测试插件&desc=添加音效让剪辑不在无聊&url=&version=0.0.1
        //     title: '测试插件',
        //     desc: '测试插件',
        //     enable: false,
        //     content: `
        //         g_plugin.
        //         registerEvent('beforeLoadURL', data => {
        //             console.log(data)
        //         }, 1).
        //         registerEvent('afterLoadURL', data => {
        //             console.log(data)
        //         }, 1);
        //     `,
        //     version: '0.0.1',
        //     primary: 1,
        // }, false)
        this.save();
    },

    loadedPlugins: [],

    // 加载所有插件
    initPlugins() {
        $(() => {
            this.loadedPlugins = this.getPlugins()
            loadRes(this.loadedPlugins, i => {
                console.info(`[plugins] 成功加载${i}个插件`);
            });
        });

    },

    // 获取所有插件
    getPlugins(all = false) {


        // TODO 插件单独再某个库运行
        let load = [];
        for (let uuid in this.list) {
            let plugin = this.list[uuid];
            if (plugin.enable) {
                load.push(this.getScipt(uuid))
            }
        }
        return load
    },

    // 初始化

    init(funs = {}) {
        const self = this

        self.list = local_readJson('plugins', {});
        if (Object.keys(self.list).length == 0) {
            self.resetPlugins();
        }
        self.initPlugins();
        g_menu.registerMenu({
            name: 'plugin_item',
            selector: '#modal_plugins tr[data-key]',
            dataKey: 'data-key',
            html: g_menu.buildItems([{
                icon: 'pencil',
                text: '编辑',
                action: 'plugin_item_edit'
            }, {
                icon: 'trash',
                text: '删除',
                class: 'text-danger',
                action: 'plugin_item_delete'
            }])
        });
        g_action.
        registerAction({
            modal_plugin: () => self.modal_show(),
            plugin_item_edit: () => {
                g_plugin.prompt_add(g_menu.key);
                g_menu.hideMenu('plugin_item');
            },
            plugin_item_delete: () => {
                g_plugin.prompt_delete(g_menu.key);
                g_menu.hideMenu('plugin_item');
            },
            plugin_edit: dom => {
                g_plugin.prompt_add(dom.dataset.key);
            },
            plugin_enable: dom => {
                let key = $(dom).parents('[data-key]').attr('data-key');
                self.setVal(key, 'enable', dom.checked)
            }
        })
        // self.modal_show();
        let init = funs.init
        if (init) {
            funs.init.apply(this)
            delete funs.init
        }
        Object.assign(this, funs)
        return this
    },

    setVal(key, k, v) {
        this.list[key][k] = v
        this.save(true)
    },

    // 弹出删除确定框
    prompt_delete(key) {
        // TODO 同时删除文件询问
        confirm('是否删除插件 【' + this.get(key).title + '】 ?', {
            title: '删除插件',
        }).then(() => {
            $('#modal_plugins_edit').modal('hide');
            // nodejs.files.remove(this.getScipt(key))
            g_plugin.remove(key);
            toast('删除成功', 'success');
        })
    },

    // 解析脚本
    parseScript(script) {
        let code = ''
        let meta = {}
        let status
        script.split('\n').forEach(text => {
            // console.log(text)
            let args = text.trim().replaceAll('  ', ' ').split(' ').filter(arg => arg != '')
            if (status != 'end' && args[0] == '//') {
                if (args[1] == '==UserScript==') {
                    status = 'start'
                } else
                if (args[1] == '==/UserScript==') {
                    status = 'end'
                } else {
                    if (args[1][0] == '@') {
                        meta[args[1]] = arr_join_range(args, ' ', 2)
                    }
                }
            } else
            if (status == 'end') {
                code += text + "\n"
            }
        })
        return { meta, code }
    },

    // 格式化脚本
    formatScript(obj, saveTo) {
        // TODO 代码格式化
        let s = ''
        for (let [k, v] of Object.entries(obj.meta)) {
            s += `// ` + k + '    ' + v + "\n"
        }
        s += obj.code
        return s
    },

    // 获取插件位置
    getScipt(key) {
        return this.getSciptPath() + key + '.js'
    },

    // 弹出编辑插件窗口
    prompt_add(key) {
        let isNew = isEmpty(key)
        let d = Object.assign({
            content: '',
            title: '',
            desc: '',
            version: '0.0.1',
            primary: 1,
            enable: false,
        }, this.get(key) || {}, { content: nodejs.files.read(this.getScipt(key), '') });

        g_form.confirm('plugins_edit', {
            elements: {
                title: {
                    title: '插件名称',
                    required: true,
                    value: d.title || '',
                },
                primary: {
                    title: '优先级',
                    value: d.primary,
                },
                desc: {
                    title: '注释',
                    value: d.desc,
                },
                version: {
                    title: '版本',
                    value: d.version || '0.0.1',
                },
                content: {
                    title: '代码',
                    type: 'textarea',
                    rows: 3,
                    value: d.content || '',
                    placeHolder: '输入代码...',
                },
                enable: {
                    title: '启用',
                    value: d.enable || false,
                    type: 'switch',
                }
            },
        }, {
            id: 'plugins_edit',
            title: '编辑插件',
            btn_ok: '保存',
            btn_cancel: isNew ? '取消' : '删除',
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    if (isNew) key = guid();
                    g_plugin.setItem(key, g_form.getVals('plugins_edit'));
                    toast('保存成功', 'success');
                } else
                if (btn.id == 'btn_cancel') {
                    if (!isNew) {
                        g_plugin.prompt_delete(key);
                        return false;
                    }
                }
            }
        })
    },

    get(key) {
        return this.list[key];
    },
    remove(key, save = true) {
        delete this.list[key];
        this.save(save);
    },
    save(save = true) {
        if (save) {
            local_saveJson('plugins', this.list);
        }
        $('#modal_plugins').length && this.rendererList();

    },
    setItem(key, value, save = true) {
        nodejs.files.write(this.getScipt(key), value.content);
        delete value.content;

        this.list[key] = value;
        this.save(save);
    },
    // 刷新列表
    rendererList() {
        let h = '';
        for (let key in this.list) {
            let d = this.list[key];
            let id = 'check_plugin_' + key;
            h += `
                <tr data-key="${key}">
                  <td>
                    <div class="form-check">
                      <input class="form-check-input" data-change="plugin_enable" type="checkbox" value="" id="${id}" ${d.enable ? 'checked' : ''}>
                      <label class="form-check-label" for="${id}"></label>
                    </div>
                  </td>
                  <td>${d.title}</td>
                  <td>${d.desc}</td>
                  <td>${d.version}</td>
                </tr>
            `;
        }
        $('#modal_plugins tbody').html(h);
    },
    // 插件列表
    modal_show() {
        let h = `
            <div class="table-responsive">
                <table class="table table-vcenter table-nowrap">
                  <thead>
                    <tr>
                      <th scope="col"></th>
                      <th scope="col">插件名</th>
                      <th scope="col">说明</th>
                      <th scope="col">版本</th>
                    </tr>
                  </thead>
                  <tbody>
                  </tbody>
                </table>
            </div>
        `;
        this.modal = g_modal.modal_build({
            id: 'plugins',
            title: '插件列表',
            width: '80%',
            once: true,
            html: h,
            buttons: [{
                    id: 'add',
                    text: '新增',
                    class: 'btn-warning',
                }, {
                    id: 'reset',
                    text: '重置',
                    class: 'btn-secondary',
                },
                /* {
                    id: 'refresh',
                    text: '刷新',
                    class: 'btn-warning',
                },*/
                 {
                    id: 'open',
                    text: '导入',
                    class: 'btn-success',
                }, {
                    id: 'more',
                    text: '获取更多',
                    class: 'btn-info',
                }
            ],
            onClose: () => {
                if (!arr_equal(this.getPlugins(), this.loadedPlugins)) {
                    confirm('插件需要重载才能生效,是否重载页面?', {
                        title: '重载页面',
                    }).then(() => location.reload())
                }
            },
            onBtnClick: (btn, modal) => {
                switch (btn.id) {
                    case 'btn_more':
                        ipc_send('url', 'https://github.com/hunmer/mSearch/issues');
                        return;
                    case 'btn_add':
                        g_plugin.prompt_add();
                        return;
                    case 'btn_reset':
                        return confirm('确定要重置吗?').then(() => g_plugin.resetAll())
                    case 'btn_open':
                        openFileDiaglog({
                            title: '打开脚本文件',
                            properties: ['openFile'],
                            filters: [
                                { name: 'js文件', extensions: ['js'] },
                            ],
                        }, path => {
                            if (!isEmpty(path[0])) {
                                this.script_import(path[0])
                            }
                        })
                        break;

                    case 'btn_refresh':
                        let path = this.getSciptPath()
                        nodejs.files.items(path).files.forEach(script => {
                            let key = getFileName(script, false)
                            if (getExtName(script) == 'js') {
                                // namespace 当作ID?
                                this.script_import(path + script, key)

                            }
                        })
                        return

                }
                //$(btn).parents('.modal').modal('hide');
            }
        });
        this.rendererList();
    },

    script_import(file, key) {
        if (!key) key = getFileName(file, false)
        let { meta } = this.parseScript(nodejs.files.read((file)))
        console.log(meta)
        this.list[key] = Object.assign(this.get(key) || {}, {
            title: meta['@name'],
            desc: meta['@description'],
            version: meta['@version'],
            enable: false,
            primary: 0,
        })
        this.save()
    },


    /* events */
    initEvent(eventName, callback, overwrite = false) {
        let event = this.getEvent(eventName, true);
        event.finish = callback;
        // 绑定最后执行函数
    },

    // 注册事件
    registerEvent(eventName, callback, primary = 1) {
        let event = this.getEvent(eventName);
        if (event) {
            event.listeners.push({
                callback: callback,
                primary: primary
            });
        }
        return this
    },

    // 取消注册事件
    unregisterEvent(eventName) {
        delete this.events[eventName];
    },

    // 获取事件
    getEvent(eventName, create = true) {
        if (create && !this.events[eventName]) {
            this.events[eventName] = {
                listeners: [],
            }
        }
        return this.events[eventName];
    },

    // 执行事件
    callEvent(eventName, data) {
        let self = this
        return new Promise(async function(reslove, reject) {
            let event = self.getEvent(eventName);
            if (event) {
                for (let k in data) {
                    if (typeof(data[k]) == 'function') {
                        // 执行函数取值
                        data[k] = data[k].apply(data)
                    }
                }
                for (let listener of event.listeners.sort((a, b) => {
                        return b.primary - a.primary;
                    })) {
                    if (await listener.callback(data) === false) {
                        return reject();
                    }
                }
                event.finish && event.finish(data);
                reslove(data)
            }
        })
    },

}