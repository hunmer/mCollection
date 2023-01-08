var g_form = {
    init() {
        // TODO input 支持获取拖拽目录
        const self = this

        g_action.registerAction({
            form_chooseFile(dom) {
                let input = dom.nextElementSibling
                let opts = self.get($(dom).parents('.form-fieldset').attr('id')).elements[input.id].opts
                opts.id = 'form_chooseFile'
                openFileDiaglog(opts, path => {
                    if (!isEmpty(path[0])) {
                        input.value = path[0]
                    }
                })
            },
            form_image(dom) {
                g_form.confirm('form_image', {
                    elements: {
                        src: {
                            title: '地址',
                            type: 'file_chooser',
                            required: true,
                            value: dom.src,
                            opts: {
                                title: '选择图片',
                                properties: ['openFile'],
                                filters: [
                                    { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
                                ],
                            }
                        },
                    },
                }, {
                    id: 'form_image',
                    title: '输入地址',
                    onBtnClick: (btn, modal) => {
                        if (btn.id == 'btn_ok') {
                            let { src } = g_form.getVals('form_image')
                            getContent('form_image').attr('src', src)
                        }
                    }
                })
            },
            form_date_show(dom){

            }
        })
    },
    preset: {},
    registerPreset(n, opts, preset) {
        this.list[n] = opts
        this.preset[n] = preset
    },
    getPreset(n, d) {
        if (this.preset[n]) return this.preset[n](d)
        switch (d.type) {
            case 'image':
                return `
                  <div class="mb-3 text-center" id="{id}">
                    <img class="avatar-rounded" title="点击上传图片" data-action="form_image" width="50">
                  </div>
                `

            case 'file':
                return `
                  <div class="mb-3">
                    <div class="form-label {required}">{title}</div>
                    <input type="file" id="{id}" class="form-control" placeholder="{placeholder}">
                  </div>
                `

            case 'date':
                return `
                <div class="form-label {required}">{title}</div>
                <div class="input-icon">
                  <input class="form-control datepicker" placeholder="{placeholder}" id="{id}">
                  <span class="input-icon-addon" data-action="form_date_show">
                    <i class="ti ti-calendar"></i>
                  </span>
                </div>
                `

            case 'file_chooser':
                return `
                <div class="mb-3">
                    <label class="form-label {required}">{title}</label>
                    <div class="input-group mb-2">
                      <span class="input-group-text" data-action="form_chooseFile" title="打开选择器">
                        <i class="ti ti-folder"></i>
                      </span>
                      <input type="text" class="form-control" id="{id}" placeholder="{placeholder}">
                    </div>
                  </div>
                `

            case 'checkbox':
                return `
                    <label class="form-check">
                        <input id="{id}" type="checkbox" class="form-check-input"/>
                        <span class="form-check-label {required}">{title}</span>
                      </label>
                `

            case 'switch':
                return `
                    <label class="form-check form-switch">
                      <input id="{id}" class="form-check-input" type="checkbox">
                      <span class="form-check-label {required}">{title}</span>
                    </label>
                `

            case 'radio':
                return `
                    <label class="form-check form-check-inline">
                        <input id="{id}" class="form-check-input" type="radio">
                        <span class="form-check-label {required}">{title}</span>
                      </label>
                `

             case 'range':
                opts = Object.assign({val: 0, min: 0, max: 100, step: 1}, d.opts)
                return `
                 <label class="form-label {required}">{title}</label>
                 <input  id="{id}" type="range" class="form-range" min="${opts.min}" max="${opts.max}" step="${opts.step}">
                `

            case 'checkbox_list':
                return `
                    <div class="form-label">{title}</div>
                    <div id="{id}">
                    ${(() => {
                        let h = ''
                        let vals = Object.values(d.list)
                        let keys = Array.isArray(d.list) ? [...vals] : Object.keys(d.list)
                        keys.forEach((k, i) => {
                            h += `
                            <label class="form-check form-check-inline">
                              <input class="form-check-input" type="checkbox" value="${k}" ${k == d.value ? 'checked' : ''}>
                              <span class="form-check-label">${vals[i]}</span>
                            </label>
                            `
                        })
                        return h || `
                什么都没有...` 
                    })()}
                    </div></div>
                `

            case 'datalist':
                return `
                    <label class="form-label">{title}</label>
                    <input id="{id}" class="form-control" list="detalist_{id}" placeholder="{placeholder}">
                    <datalist id="detalist_{id}">
                    ${(() => {
                        let h = ''
                        let vals = Object.values(d.list)
                        let keys = Array.isArray(d.list) ? [...vals] : Object.keys(d.list)
                        keys.forEach((k, i) => {
                            h += `<option value="${k}" ${k == d.value ? 'selected' : ''}>${vals[i]}</option>`
                        })
                        return h
                    })()}
                    </datalist>
                `

            case 'select':
                return `
                    <label class="form-label">{title}</label>
                    <select id="{id}" class="form-select" placeholder="{placeholder}" {props}>
                    ${(() => {
                        let h = ''
                        let vals = Object.values(d.list)
                        let keys = Array.isArray(d.list) ? [...vals] : Object.keys(d.list)
                        keys.forEach((k, i) => {
                            h += `<option value="${k}" ${k == d.value ? 'selected' : ''}>${vals[i]}</option>`
                        })
                        return h
                    })()}
                    </select>
                `

            case 'textarea':
                return `
                    <label class="form-label {required}">{title}</label>
                    <textarea id="{id}" rows="{rows}" placeholder="{placeholder}" class="form-control"/></textarea>
                `

            default:
                return `
                    <label class="form-label {required}">{title}</label>
                    <input id="{id}" placeholder="{placeholder}" type="text" class="form-control"/>
                `
        }
    },
    list: {},
    build(name, opts) {
        opts = Object.assign({

        }, opts)
        this.list[name] = opts
        let html = ''
        for (let name of Object.keys(opts.elements).sort((a, b) => (opts.elements[b].primary || 0) - (opts.elements[a].primary || 0))) {
            html += this.buildElement(name, opts.elements[name])
        }
        return `<div id="form_${name}" >` + html + '</div>';
    },

    buildElement(name, item) {
        return `<div id="form_elements_${name}" class="${item.class || ''}">` + (item.html || `
             <div class="mt-3 mb-3">` + this.getPreset(item.type, item) + '</div>')
            .replaceAll('{id}', name)
            .replaceAll('{title}', item.title || '')
            .replaceAll('{rows}', item.rows || 3)
            .replaceAll('{props}', item.props || '')
            .replaceAll('{required}', item.required ? 'required' : '')
            .replaceAll('{placeholder}', item.placeHolder || '') + '</div>'
    },

    // 一些第三方插件的初始化
    form_init(name) {
        let d = this.get(name)
        let div = this.getContent(name)
        for(let [k, v] of Object.entries(d.elements)){
            if(v.type == 'date'){
                let opts = Object.assign({
                    element: this.getElement(name, k).find('.datepicker')[0],
                    lang: 'zh-CN',
                    buttonText: {
                        previousMonth: `<i class="ti ti-chevron-left"></i>`,
                        nextMonth: `<i class="ti ti-chevron-right"></i>`,
                    },
                    css: [],
                    zIndex: 999999,
                }, v.opts || {})
                let picker = new easepick.create(opts)
                picker.on('select', date => {
                    console.log(date, picker)
                });
            }
        }
    },

    // 对话框展示
    confirm(name, form_opts, modal_opts) {
        let onShow = modal_opts.onShow
        modal_opts.onShow = function() {
            g_form.reload(name, form_opts)
            g_form.update(name)
            typeof(onShow) == 'function' && onShow()
        }

        confirm(`<fieldset id="${name}" class="form-fieldset ${form_opts.class || ''}"></fieldset>`, modal_opts)
    },

    // 简便写法
    confirm1(opts, modal_opts = {}) {
        let id = opts.id
        this.confirm(id, {
            elements: opts.elements,
        }, Object.assign({
            id,
            title: opts.title || '',
            btn_ok: opts.btn_ok || '确定',
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    if (opts.callback({ vals: this.getVals(id), changes: this.getChanges(id) }) === false) return false
                }
            }
        }, modal_opts))
    },

    // 返回默认值变动过的列表
    getChanges(name) {
        let r = {}
        let d = this.get(name)
        if (d.elements) {
            let vals = this.getVals(name)
            for (let [k, v] of Object.entries(d.elements)) {
                let val = typeof(v.value) == 'function' ? v.value() : v.value
                if (val != vals[k]) {
                    r[k] = vals[k]
                }
            }
        }
        return r
    },

    // 更新form
    update(name) {
        let div = this.getContent(name)
        if (div.length) {
            let d = this.get(name)
            for (let [id, v] of Object.entries(d.elements)) {
                let ele = div.find('#' + id)
                let val = typeof(v.value) == 'function' ? v.value() : v.value
                if (v.setVal) {
                    v.setVal(ele, val)
                } else {
                    this.setInputVal(v.type || 'text', ele[0], val)
                }
            }
        }
    },

    reload(name, opts) {
        $('#' + name).html(this.build(name, opts))
    },

    get(name) {
        return this.list[name]
    },

    getContent(name) {
        return $('#form_' + name)
    },

    setInputVal(type, dom, val) {
        let d = this.get(type)
        if (d && d.setVal) return d.setVal(dom, val)
        if (!dom) return
        switch (type) {
            case 'checkbox':
            case 'switch':
            case 'radio':
            case 'datalist':
                return dom.checked = Boolean(val)

                // case 'file':
            case 'text':
            case 'textarea':
            case 'date':
            case 'select':
            case 'file_chooser':
            case 'range':
                return dom.value = val || ''

            case 'checkbox_list':
                // TODO 新增的内容必须重新生成
                return $(dom).find('input[value="' + val + '"]').prop('checked', true)

            case 'image':
                return $(dom).find('img').attr('src', val)
        }
    },

    // 更新form元素值
    setElementVal(name, key, val, attr = 'value') {
        let d = this.get(name)
        let keys = typeof(key) == 'object' ? Object.keys(key) : [key]
        let vals = typeof(key) == 'object' ? Object.values(key) : [val]
        keys.forEach((key, i) => {
            if (d.elements[key]) {
                d.elements[key][attr] = vals[i]
                // $(`#form_${name} #form_elements_${key}`).replaceWith(this.buildElement(key, d.elements[key]))
                // this.setInputVal()
            }
        })
        this.update(name)
    },

    getElement(name, key){
        return  $(`#form_${name} #form_elements_${key}`)
    },

    getInputVal(type, dom) {
        let d = this.get(type)
        if (d && d.getVal) return d.getVal(dom)
        switch (type) {
            case 'checkbox':
            case 'switch':
            case 'radio':
            case 'datalist':
                return dom.checked
            case 'text':
            case 'textarea':
            case 'date':
            case 'select':
            case 'file_chooser':
                return dom.value

            case 'range':
                return dom.value * 1

            case 'checkbox_list':
                let r = []
                $(dom).find('input:checked').each((i, input) => r.push(input.value))
                return r

            case 'image':
                return $(dom).find('img').attr('src')
        }
        return false
    },

    setInvalid(name, key, invaild = true) {
        let div = this.getContent(name)
        div.find('#' + key).toggleClass('is-invalid', invaild)
    },

    getVals(name) {
        let r = {}
        let div = this.getContent(name)
        if (div.length) {
            let d = this.get(name)
            for (let [id, attr] of Object.entries(d.elements)) {
                let input = div.find('#' + id)
                if (!input.length) continue

                let val = attr.getVal ? attr.getVal(input) : this.getInputVal(attr.type || 'text', input[0])
                if (attr.required) {
                    let invaild = typeof(val) == 'string' ? isEmpty(val) : val
                    input.toggleClass('is-invalid', invaild)
                    if (invaild) return
                    // <div class="invalid-feedback">Invalid feedback</div>
                }
                r[id] = val
            }
        }
        return r
    }

}

g_form.init()

// confirm(`<fieldset id="test" class="form-fieldset"></fieldset>`, {
//     title: '添加下载',
//     btn_ok: '添加',
//     onShow: () => {
//         $('#test').html(g_form.build('test', {
//             elements: {
//                 text: {
//                     title: 'text',
//                     placeHolder: '...',
//                     value: 'aaa',
//                 },
                // date: {
                //     title: '日期',
                //     type: 'date',
                //     required: true,
                //     value: '',
                //     opts: {
                //         css: ['js/plugins/litepicker/index.css']
                //     }
                // },
//                 file_chooser: {
//                     title: 'choose a file',
//                     type: 'file_chooser',
//                     placeHolder: '...',
//                     value: 'a.mp4',
//                 },
//                 input: {
//                     title: 'input',
//                     type: 'file',
//                     placeHolder: '...',
//                     value: 'aa.mp4',
//                 },
//                 textarea: {
//                     title: 'textarea',
//                     type: 'textarea',
//                     rows: 3,
//                     placeHolder: '...',
//                     value: 'aaa',
//                 },
//                 checkbox: {
//                     title: 'checkbox',
//                     type: 'checkbox',
//                     value: true,
//                 },
//                 switch: {
//                     title: 'switch',
//                     type: 'switch',
//                     value: true,

//                 },
//                 radio: {
//                     title: 'radio',
//                     type: 'radio',
//                     value: true,
//                 },
//                 datalist: {
//                     title: 'datalist',
//                     type: 'datalist',
//                     list: {
//                         k1: '啊',
//                         k2: '额',
//                         k3: 'v3',
//                     },
//                     value: 'k2',
//                 },
//             },
//         }))
//         g_form.update('test')
//         g_form.form_init('test')
//     },
//     onBtnClick: (btn, modal) => {
//         if (btn.id == 'btn_ok') {
//             let vals = g_form.getVals('test')
//             console.log(vals)
//             return Object.keys(vals).length > 0
//         }
//     }
// })

function openFileDiaglog(opts, callback) {
    if (typeof(opts) != 'object') opts = { id: opts }
    opts = Object.assign({
        title: '选择文件',
        properties: ['openFile'],
    }, opts)
    g_pp.set(opts.id, path => callback(path));
    ipc_send('fileDialog', opts)
}