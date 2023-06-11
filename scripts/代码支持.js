// ==UserScript==
// @name        代码支持
// @version     1.0
// @author      hunmer
// @description 让软件支持存储插件片段
// ==/UserScript==

var g_code = {

    init() {
        const self = this

        g_action.registerAction({
            code_add() {

            },
            code_edit() {

            },
        })

        g_style.addStyle('code', `
            .codeflask__pre { height: 100%; }
            .codeflask pre { background: unset }
        `)

        g_plugin.registerEvent('db_afterInsert', ({ opts, ret }) => {
            let { table, data } = opts
            if (table == 'files' && data.ext == 'code') {
                g_data.data_set2({
                    table: 'code',
                    dbFile: this.db_file(),
                    key: 'md5',
                    value: d.md5,
                    ext: 'code',
                    data: {
                        code: data.code
                    }
                }).then(() => console.log('add ok'))
            }
        })

        loadRes(g_plugin.getSciptPath() + 'code/codeflask.min.js', () => {

            let flask
            g_form.registerPreset('code', {
                setVal: (dom, val) => {
                    dom.innerHTML = val
                    flask = new CodeFlask(dom, {
                        language: 'js',
                        lineNumbers: true,
                    });
                },
                getVal: dom =>  flask.getCode(),
                getPreset: `
                    <label class="form-label {required}">{title}</label>
                    <div id="{id}" style="position: relative;height: 300px;margin-right: 10px;">{placeholder}</div>
                    `
            }) 

            self.code_edit({
                // TODO 一个函数 可以创建不存在的标签 支持数组
                //tags: ['http', 'socket'],
                desc: 'desc..',
                title: 'code_' + new Date().getTime(),
                // folders: [g_folder.folder_getParentByid('javascript')],
                code: `
                function foo(){
                    return 'Hello'
                }
            `,
            })
        })

    },

    db_file() {
        return g_db.db_getCurrentVal('path') + '/code.db'
    },

    code_edit(d) {
        d = Object.assign({
            folders: [],
            tags: [],
            title: '',
            code: '',
            desc: '',
            md5: nodejs.files.randomMd5(),
        }, d)

        g_form.confirm1({
            id: 'code_edit',
            title: '编辑片段',
            btn_ok: '保存',
            elements: {
                title: {
                    title: '标题',
                    value: d.title,
                },
                folders: {
                    title: '文件夹',
                    type: 'folders',
                    value: d.folders,
                },
                tags: {
                    title: '标签',
                    type: 'tags',
                    value: d.tags,
                },
                desc: {
                    title: '注释',
                    type: 'textarea',
                    value: d.desc,
                },
                code: {
                    title: '代码',
                    type: 'code',
                    required: true,
                    value: d.code,
                },
            },
            async callback({ vals }) {
                let code = vals.code
                if (isEmpty(code)) return

                let md5 = d.md5
                let data = Object.assign(d, vals)
                delete data.code

                let r = {}
                r[md5] = data

                data.file = await g_db.getSaveTo(md5) + vals.title + '.js' // TODO 根据语言文件名如.js
                nodejs.files.write(data.file, code)
                data.ext = 'code'
                data.size = code.length
                // data.meta = {lang: 'js'}
                console.log(data)
                g_data.data_import(r).then(() => console.log('ok'))
            }
        }, {
            scrollable: true,
            width: '80%',
            onShow() {
                console.log('show')
                // 
            }
        })
    },



}
if (g_db.current == '1676259284915') g_code.init()