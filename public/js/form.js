var g_form = {
    init() {
        // TODO input 支持获取拖拽目录
        const self = this

        g_action.registerAction('form_chooseFile', dom => {
            let input =  dom.nextElementSibling 
            let opts = self.get($(dom).parents('.form-fieldset').attr('id')).elements[input.id].opts
            opts.id = 'form_chooseFile'
            openFileDiaglog(opts, path => {
              input.value = path[0] || ''
            })
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
                  <span class="input-icon-addon">
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
                    <select id="{id}" class="form-select" placeholder="{placeholder}">
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
        for(let name of Object.keys(opts.elements).sort((a, b) => (opts.elements[b].primary || 0) - (opts.elements[a].primary || 0))){
            let item = opts.elements[name]
              html += `<div id="form_elements_${name}" class="${item.class || ''}">`+ (item.html || `
             <div class="mt-3 mb-3">` + this.getPreset(item.type, item) + '</div>')
                .replaceAll('{id}', name)
                .replaceAll('{title}', item.title || '')
                .replaceAll('{rows}', item.rows || 3)
                .replaceAll('{required}', item.required ? 'required' : '')
                .replaceAll('{placeholder}', item.placeHolder || '') + '</div>'
        }
        return `<div id="form_${name}" >` + html + '</div>';
    },

    // 一些第三方插件的初始化
    form_init(name) {
        let div = this.getEle(name)
        for (let dom of div.find('.datepicker')) {
            new Litepicker({
                element: dom,
                buttonText: {
                    previousMonth: `<i class="ti ti-chevron-left"></i>`,
                    nextMonth: `<i class="ti ti-chevron-right"></i>`,
                },
            })
        }
    },

    // 对话框展示
    confirm(name, form_opts, modal_opts) {
        let onShow = modal_opts.onShow
        
        modal_opts.onShow = function() {
            $('#' + name).html(g_form.build(name, form_opts))
            g_form.update(name)
            typeof(onShow) == 'function' && onShow()
        }

        confirm(`<fieldset id="${name}" class="form-fieldset ${form_opts.class || ''}"></fieldset>`, modal_opts)
    },

    // 简便写法
    confirm1(opts){
         g_form.confirm(opts.id, {
            elements: opts.elements,
        }, {
            id: opts.id,
            title: opts.title || '',
            btn_ok: opts.btn_ok || '确定',
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    if(opts.callback({vals: g_form.getVals('db_edit'), changes: g_form.getChanges('db_edit')}) === false) return false
                }
            }
        })
     },

    // 返回默认值变动过的列表
    getChanges(name) {
        let r = {}
        let d = this.get(name)
        if (d.elements) {
            let vals = this.getVals(name)
            for (let [k, v] of Object.entries(d.elements)) {
                if (v.value != vals[k]) {
                    r[k] = vals[k]
                }
            }
        }
        return r
    },

    update(name) {
        let div = this.getEle(name)
        if (div.length) {
            let d = this.get(name)
            for (let [id, attr] of Object.entries(d.elements)) {
                this.setInputVal(attr.type || 'text', div.find('#' + id)[0], attr.value)
            }
        }
    },

    get(name) {
        return this.list[name]
    },

    getEle(name) {
        return $('#form_' + name)
    },

    setInputVal(type, dom, val) {
        let d = this.get(type)
        if (d && d.setVal) return d.setVal(dom, val)
        if (!dom) return
        switch (dom.type) {
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
                return dom.value = val || ''
        }
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
        }

        // if (dom.checked ) return dom.checked === true;
        // if (dom.selected ) return dom.selected === true;
        // if (dom.value != undefined){
        //     return dom.value
        // }
        return false
    },

    setInvalid(name, key, invaild = true) {
        let div = this.getEle(name)
        div.find('#' + key).toggleClass('is-invalid', invaild)
    },

    getVals(name) {
        let r = {}
        let div = this.getEle(name)
        if (div.length) {
            let d = this.get(name)
            for (let [id, attr] of Object.entries(d.elements)) {
                let input = div.find('#' + id)
                if(!input.length) continue
                let val = this.getInputVal(attr.type || 'text', input[0])
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
//                 date: {
//                     title: 'date',
//                     type: 'date',
//                     placeHolder: '...',
//                     value: '2022/3/10',
//                 },
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