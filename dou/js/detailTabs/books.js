let g_books = {
    cache: {},
    init() {
        const self = this
        self.list = local_readJson('books', [])

        g_menu.registerMenu({
            name: 'book_item',
            selector: '#table_books_import tr',
            dataKey(el) {
                let tds = el.find('td')
                return self.find({ key: tds[0].innerText, value: tds[1].querySelector('a').dataset.text })
            },
            html: g_menu.buildItems([{
                icon: 'pencil',
                text: '编辑',
                action: 'book_item_edit'
            }, {
                icon: 'trash',
                text: '删除',
                class: 'text-danger',
                action: 'book_item_delete'
            }]),
        });

        g_action.registerAction(['book_item_edit', 'book_item_delete'], (dom, action) => {
            let i = g_menu.key
            let d = self.list[i]
            switch (action[0]) {
                case 'book_item_edit':
                    self.edit(copyObj(d))
                    break;

                case 'book_item_delete':
                    self.list.splice(i, 1)
                    self.save()
                    break;
            }
            g_menu.hideMenu('book_item')
        })

        g_action.registerAction({
            _openLink(dom) {
                let url = dom.dataset.text || dom.dataset.url || dom.outerText
                g_browser.openURL(url)
            },
            copyText(dom) {
                let text = dom.dataset.text || dom.dataset.url || dom.outerText
                ipc_send('copy', text)
            },
            books_export() {
                let file = nodejs.dir + '\\books.json'
                nodejs.files.write(file, JSON.stringify(self.list))
                toast(`<a href='#' onclick="ipc_send('openFile', '${file}')">成功导出!</a>`, 'success')
            },
            books_import() {
                self.parse()
            },
            books_importData() {
                openFileDiaglog({
                    id: 'books_importJSON',
                    title: '选择数据文件',
                    properties: ['openFile'],
                    filters: [
                        { name: 'json', extensions: ['json'] },
                    ],
                }, path => {
                    if (!isEmpty(path[0])) {
                        self.importData(JSON.parse(nodejs.files.read(path[0])))
                    }
                })
            },
            books_refresh() {
                self.refresh()
            },
            books_add() {
                self.edit()
            },
            books_upload() {
                g_person.request({
                    type: 'upload',
                    id: 'jjh',
                    data: self.list,
                }, ret => toast(ret.msg, ret.code == 'ok' ? 'success' : 'danger'), 'books.php')
            },
            books_sync() {
                g_person.request({
                    type: 'sync',
                    id: 'jjh',
                }, ret => {
                    self.importData(ret)
                }, 'books.php')
            },
            books_clear() {
                confirm('确定清空吗?', {
                    title: '清空表格',
                    type: 'danger'
                }).then(() => self.clear())
            },
            // 
            select_books_key(dom) {
                // 禁用另一个select的相同option
                let anthor = $(dom).parents('td').siblings().filter('._select')
                anthor.find('option:gt(0):disabled').prop('disabled', false)
                anthor.find('option[value="' + dom.value + '"]').prop('disabled', true)
            },

        })

        const parseItems = (items, checked = false) => {
            let h = ''
            items.forEach(({ key, value }, i) => {
                h += `
                      <label class="form-selectgroup-item">
                        <input type="checkbox" title="${key}" value="${value}" class="form-selectgroup-input" ${checked ? 'checked' : ''} >
                        <span class="form-selectgroup-label">${key}</span>
                      </label>
                   `
            })
            return h ? `<div class="form-selectgroup w-full">${h}</div>` : '<h4 class="text-center">没有任何结果...</h4>'
        }
        g_action.registerAction({
            input_book_search(dom) {
                $('#books_selector').html(parseItems(self.search(dom.value).splice(0, 6)))
            }
        })

        g_form.registerPreset('books', {
            setVal: (dom, val) => {
                $('#books_selector').html(parseItems(val, true))
            },
            getVal: dom => {
                return Array.from($('#books_selector input:checked').map((i, input) => {
                    return { value: input.value, key: input.title }
                }))
            }
        }, d => {
            return `
             <label class="form-label">{title}</label>
              <div class="card shadow-none bg-transparent w-full" id="{id}" style="min-height: 38px;">
                <input class="form-control" placeholder="搜索图书(支持汉字首拼音)" data-input="input_book_search">
                <div class="w-full p-2" id="books_selector">
                    <h4 class="text-center">结果将会在这里展示...</h4>
                </div>
              </div>
            `
        })
    },

    importData(data, clear = false) {
        console.log(data)
        if (Array.isArray(data) && data.length) {
            let callback = clear => {
                if (clear) this.list = []
                let i = 0
                data.forEach(item => {
                    console.log(item, this.find(item))
                    if (this.find(item) == -1) {
                        i++
                        this.list.push(item)
                    }
                })
                this.save()
                toast('成功导入' + i + '条数据', 'success')
            }
            confirm('是否覆盖商品?', { type: 'success' }).then(() => callback(true), () => callback(data))
        } else {
            toast('没有任何数据...', 'danger')
        }
    },

    modal_search(callback) {
        alert(`
            <input class="form-control mb-1 border-bottom" placeholder="">
            
        `, {
            title: '选择品',
            onShow(modal) {
                modal.find('input').on('input', function(e) {
                    let h = ''

                })
            },

        }).then(() => {
            callback()
        })
    },
    edit(d) {
        if (!d) d = {
            key: '',
            value: ''
        }
        let isNew = d.key == ''
        g_form.confirm('books_add', {
            elements: {
                key: {
                    title: '书名',
                    value: d.key,
                    required: true,
                },
                value: {
                    title: '链接',
                    value: d.value,
                    required: true,
                },
                desc: {
                    title: '注释',
                    value: d.desc || '',
                },
            },
        }, {
            id: 'books_add',
            title: (isNew ? '新建' : '编辑') + '链接',
            btn_ok: '保存',
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    this.add(g_form.getVals('books_add'))
                    toast('成功保存!', 'success')
                }
            }
        })
    },
    save(refresh = true) {
        local_saveJson('books', this.list);
        refresh && this.refresh();
    },
    add(d, refresh = true) {
        let index = this.find(d)
        if (index == -1) index = this.list.length
        this.list[index] = d
        this.save(refresh)
    },
    clear() {
        this.list = []
        this.save()
    },
    find(o) {
        return this.list.findIndex(item => item.key == o.key && item.value == o.value)
    },
    search(s) {
        let py = PinYinTranslate.start(s);
        let sz = PinYinTranslate.sz(s);
        return this.list.filter(({ key, value, desc }, i) => key.indexOf(s) != -1 || PinYinTranslate.start(key).indexOf(py) != -1 || PinYinTranslate.sz(key).indexOf(sz) != -1)
    },
    refresh() {
        this.inited = true
        let h = ''
        this.search(getEle({ input: 'books_refresh' }).val())
            .forEach(({ key, value, desc }, i) => {
                h += `
             <tr>
              <td data-action="copyText" class="text-nowrap">${key}</td>
              <td><a href="#" data-action="copyText" data-text="${value}" data-dblclick="_openLink">${value ? '<i class="ti ti-link fs-2"></i>' : ''}</a></td>
              <td>${!isEmpty(desc) ? `<a href="#" data-action="copyText" data-text="${desc}"><i class="ti ti-clipboard fs-2"></i></a>` : ''}</td>
            </tr>
            `
            })
        $('#tab_books').html(h ? `
            <div class="table-responsive">
                <table class="table table-vcenter mb-0" id='table_books_import'>
                  <thead>
                    <tr>
                      <th>书名</th>
                      <th>链接</th>
                      <th class="w-2">注释</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${h}
                  </tbody>
                </table>
              </div>` : `<h4 class="text-center">还没有导入任何数据...</h4>`)
    },


    parse() {
        const self = this
        $('#file_books').remove()
        loadRes(['js/xlsx.core.min.js'], () => {
            let input = $('<input type="file" id="file_books" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel">').appendTo('body').
            on('change', function(e) {
                let fileReader = new FileReader();
                fileReader.onload = function(ev) {
                    let workbook = XLSX.read(ev.target.result, {
                        type: 'binary'
                    }) // 以二进制流方式读取得到整份excel表格对象
                    let data = []; // 存储获取到的数据
                    for (var sheet in workbook.Sheets) {
                        if (workbook.Sheets.hasOwnProperty(sheet)) {
                            data = data.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
                            //break; // 如果只取第一张表，就取消注释这行
                        }
                    }
                    console.log(data);

                    if (!data.length) return toast('没有任何数据', 'danger')
                    let select = `<select class="form-select" data-change="select_books_key" value=""><option value='' disabled selected>请选择</option>`
                    for (let [k, v] of Object.entries(data[0])) {
                        select += `<option value="${k}" title='${v}'>${k}</option>`
                    }
                    select += '</select>'

                    let newLine = () => $(`
                        <tr>
                          <td class="_select">
                            ${select}
                          </td>
                          <td class="_select">
                            ${select}
                          </td>
                          <td>
                            <button class="btn btn-ghost-danger"  onclick="$(this).parents('tr').remove()"><i class="ti ti-trash fs-2"></i></button>
                          </td>
                        </tr>`).appendTo('#table_books_import tbody')

                    alert(`
                    <div class="table-responsive">
                        <table class="table mb-0" id='table_books_import'>
                          <thead>
                            <tr>
                              <th>KEY</th>
                              <th>VALUE</th>
                              <th class="w-1"></th>
                            </tr>
                          </thead>
                          <tbody>
                          </tbody>
                        </table>
                      </div>
                      `, {
                        id: 'select_books_key',
                        once: true,
                        title: '设置导入数据',
                        buttons: [{
                            text: '新行',
                            class: 'btn-info',
                            id: 'new',
                        }, {
                            text: '导入',
                            class: 'btn-primary',
                            id: 'ok',
                        }],
                        onShow: () => newLine(),
                        onBtnClick: (btn, modal) => {
                            if (btn.id == 'btn_ok') {
                                let i = 0
                                for (let tr of $('#table_books_import tr:gt(0)')) {
                                    let a = []
                                    for (let select of $(tr).find('select')) {
                                        let v = select.value
                                        if (v == '') {
                                            return toast('有的没选', 'danger')
                                        }
                                        a.push(v)
                                    }
                                    // 导入
                                    for (let item of data) {
                                        let key = item[a[0]]
                                        let value = item[a[1]]
                                        if (key != undefined && value != undefined) { // 都不能为空
                                            let d = { key, value }
                                            if (!self.find(d)) {
                                                i++
                                                self.list.push(d)
                                            }
                                        }
                                    }
                                }
                                self.save()
                                toast('成功导入' + i + '条数据', 'success')
                                g_modal.remove('select_books_key')
                            } else {
                                newLine()
                            }
                        }
                    })
                }
                fileReader.readAsBinaryString(this.files[0]);
                this.remove()
            })
            setTimeout(() => input[0].click(), 250)
        })
    },
}
g_detailTabs.register('books', {
    index: 3,
    onTabChanged: btn => {
        if (!g_books.inited) g_books.refresh()
    },
    tab: {
        id: 'books',
        title: '<i class="ti ti-shopping-cart fs-2"></i>',
        html: `
            <div class="input-group">
                <input type="text" class="form-control" placeholder="搜索..." data-input="books_refresh">
                <button type="button" class="btn" data-action="books_add"><i class="ti ti-plus fs-2"></i></button>
                <button data-bs-toggle="dropdown" type="button" class="btn dropdown-toggle dropdown-toggle-split" aria-expanded="false"></button>
                <div class="dropdown-menu dropdown-menu-end" style="">
                   <a class="dropdown-item" href="#" data-action="books_upload">
                    上传表格
                  </a>
                  <a class="dropdown-item" href="#" data-action="books_sync">
                    同步表格
                  </a>
                  <a class="dropdown-item" href="#" data-action="books_import">
                    导入表格
                  </a>
                  <a class="dropdown-item" href="#" data-action="books_importData">
                    导入数据
                  </a>
                   <a class="dropdown-item" href="#" data-action="books_export">
                    导出表格
                  </a>
                  <a class="dropdown-item text-danger" href="#" data-action="books_clear">
                    清空表格
                  </a>
                </div>
              </div>
            <div class="overflow-y-auto h-full mt-2" id="tab_books">

            </div>
      `
    },
}, g_books)