let g_books = {
    cache: {},
    init() {
        const self = this
        self.list = local_readJson('books', [])

        g_menu.registerMenu({
            name: 'book_item',
            selector: '#table_books_import tr[data-index]',
            dataKey: 'data-index',
            html: g_menu.buildItems([{
                icon: 'pencil',
                text: '编辑',
                action: 'book_item_edit'
            },{
                icon: 'trash',
                text: '删除',
                class: 'text-danger',
                action: 'book_item_delete'
            } ]),
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
                let url = dom.dataset.url || dom.outerText
                g_browser.openURL(url)
            },
            copyText(dom) {
                let text = dom.dataset.url || dom.outerText
                ipc_send('copy', text)
            },
            books_import() {
                self.parse()
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
                    if (Array.isArray(ret) && ret.length) {
                        let callback = clear => {
                            if (clear) self.list = []
                            let i = 0
                            ret.forEach(item => {
                                if (!self.find(item)) {
                                    i++
                                    self.list.push(item)
                                }
                            })
                            self.save()
                            toast('成功导入' + i + '条数据', 'success')
                        }

                        confirm('是否覆盖商品?', { type: 'success' }).then(() => callback(true), () => callback())
                    } else {
                        toast('没有任何数据...', 'danger')
                    }
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
            }
        })
    },
    edit(d) {
        if (!d) d = {
            key: '',
            value: ''
        }
        console.log(d)
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
    add(d, refresh = true){
        if(!this.find(d)){
            this.list.push(d)
            this.save(refresh)
            return true
        }
    },
    clear() {
        this.list = []
        this.save()
    },
    find(o) {
        return this.list.find(item => {
            let equal = false
            for (let [k, v] of Object.entries(o)) {
                equal = o[k] == item[k]
                if (!equal) break;
            }
            if (equal) return true
        })
    },
    refresh() {
        this.inited = true
        let h = ''
        let s = getEle({ input: 'books_refresh' }).val()
        let py = PinYinTranslate.start(s);
        let sz = PinYinTranslate.sz(s);
        this.list.forEach(({ key, value }, i) => {

            if ( key.indexOf(s) != -1 || PinYinTranslate.start(key).indexOf(py) != -1 || PinYinTranslate.sz(key).indexOf(sz) != -1) h += `
             <tr data-index="${i}">
              <td data-action="copyText" class="text-nowrap">${key}</td>
              <td><a href="#" data-action="copyText" data-dblclick="_openLink">${value}</a><td>
            </tr>
            `
        })
        $('#tab_books').html(h ? `
            <div class="table-responsive">
                <table class="table mb-0" id='table_books_import'>
                  <thead>
                    <tr>
                      <th>书名</th>
                      <th>链接</th>
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
                          <td>
                          <td>
                            <button class="btn btn-ghost-danger"  onclick="$(this).parents('tr').remove()"><i class="ti ti-trash fs-2"></i></button>
                          <td>
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