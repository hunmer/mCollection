// ==UserScript==
// @name    本地文件夹列表
// @version    1.0
// @author    hunmer
// @icon      folders:orange
// @updateURL    https://neysummer2000.fun/mCollection/scripts/本地文件夹列表.js
// @description    链接本地目录，像文件管理器一样浏览文件
// @namespace    80906a1e-6a69-4a4d-bb6d-77c5b0e7dc47

// ==/UserScript==

({
    init() {
        const _type = 'localFolder'
        const _inst = g_speicalFolder
        g_lang.adds({
            [`sf_${_type}`]: {
                zh: '目录',
                en: '',
            }
        })
        if(!_inst.search('type', _type)){
            _inst.add('test_folder1', {
                type: _type,
                title: '本地测试目录1',
                icon: 'folder',
                path: 'C:/testFolder/',
            })
        }

        g_dataResult.register(_type, {
            opts: {
                root: '',    // 根目录
                current: '', // 当前展示的子目录
            },
            toString() {
                return this.getOption('root')
            },
            async all(){
                let {root, current} = this.opts
                let path = current || root // 合并目录
                let list = (await Promise.all(
                    nodejs.fs.readdirSync(path).map(async title => {
                    let file = path + title
                    let stats = nodejs.fs.statSync(file)
                    let isDir = stats.isDirectory()
                    let type = isDir ? 'folder' : 'file'
                    if(isDir) file += '/'
                    
                    let data = await g_data.data_get1({ table: 'files', key: 'link', value: file })
                    let {size, birthtimeMs, mtimeMs, ino} = stats
                    // 批量获取文件md5不现实，这里用文件ino号
                    
                    return {
                        md5: data?.md5 || String(ino), file, type, title, data,
                        size: parseInt(size),
                        date: mtimeMs,
                        birthtime: birthtimeMs,
                        link: file,
                        // table: 'localFolder',
                        cover: data ? await g_item.item_getVal('cover', data) : g_format.getFormatIcon(file), // TODO 不同文件类型不同缩略图
                    }
                }))).sort((a, b) => { // 文件夹优先，其次是修改时间
                    let i = Number(b.type == 'folder') - Number(a.type == 'folder')
                    if(i != 0) return i
                    return b.mtimeMs - a.mtimeMs
                })
                this.getItems = () => list
                return list
            },
            parseItem(item){
                if(typeof(item) != 'object') item = this.getItems().find(({md5}) => md5 == item)
                return item
            },
            async columns(items){
                if(items.length == 1 && items[0].data){
                    items = [items[0].data] // 取数据库里的数据
                    return {items, ...g_dataResult.get('sqlite').columns(items)}
                }
                return {type: 'localFolder', columns: {
                    added: {
                        multi: true,
                        html(items){
                            let linked = items.some(item => item.data != undefined)
                            return `
                                <div class="text-center w-full flex flex-nowarp m-0">
                                    <div><i class="ti ti-link mb-2" style="font-size: 4rem"></i></div>
                                    <div><span class="col-12">链接到库</span></div>
                                    <div><button class="btn mt-2 btn-ghost-success" data-action="localFolder_item_linked">设置链接</button></div>
                                    ${linked ? `
                                    <div><button class="btn mt-2 btn-ghost-danger" data-action="localFolder_item_unlinked">取消链接</button></div>` : ''}
                                </div>
                            `
                        }
                    },
                    status: {
                        multi: true,
                        classes: 'border-top mh-50',
                        list: {
                            files: {
                                check: i => i > 1,
                                title: '文件数量',
                                class: 'bg-indigo-lt',
                                getVal(items) {
                                    let cnt = items.length
                                    if (cnt > 1) return cnt
                                }
                            },
                            size: {
                                title: '大小',
                                class: 'bg-indigo-lt',
                                getVal: items => renderSize(items.reduce((total, item) => total + item.size, 0))
                            },
                            date: {
                                check: i => i == 1,
                                title: '改动',
                                class: 'bg-red-lt',
                                primary: -10,
                                getVal: ([d]) => getFormatedTime(5, d.date)
                            },
                            bir: {
                                check: i => i == 1,
                                title: '创建',
                                class: 'bg-red-lt',
                                primary: -11,
                                getVal: ([d]) => getFormatedTime(5, d.birthtime)
                            }
                        },
                        async html(items) {
                            let h = ''
                            let cnt = items.length
                            for (const [k, v] of Object.entries(this.list).sort((a, b) => {
                                let a1 = a[1].primary || 0
                                let b1 = b[1].primary || 0
                                return b1 - a1
                            })) {
                                if (v.check && v.check(cnt) === false) continue
                                let val = await v.getVal(items)
                                if (isEmpty(val) || val === false) continue
                                h += `
                                    <div class="d-flex p-1" ${v.props || ''}>
                                        <span class="badge ${v.class}">${v.title}</span>
                                        <div class="flex-fill text-end">${val}</div>
                                    </div>
                                `
                            }
                            return `
                                <div class="rows align-items-center mt-2 w-full align-self-end">
                                    ${h}
                                </div>`
                        }
                    }
                }, sort: ['preview', 'status']}
            },
        })

        // g_plugin.registerEvent('db_afterInsert',  ({ opts, ret, method }) => {
        //     let fid = ret.lastInsertRowid
        //     let {data, table} = opts
        //     if(fid && data.link){
        //         if(table == 'files'){


        //         }else
        //         if(table == 'trash'){

        //         }
        //     }
        // })

        g_action.registerAction({
            localFolder_item_folder(dom){
                let {md5, file} = dom.dataset
                let tab = getParentData(dom, 'tabContent')
                
                g_tabs.method('tablist', 'setValues', tab, {
                    'data.items': [],
                    'data.sqlite.opts.current':  file
                })
            },

            localFolder_item_dbClick(dom){
                let {md5, file, action} = dom.dataset
                if(action == 'localFolder_item_file'){ // 兼容预览太麻烦了，直接打开文件
                    if(md5.length != 32) return ipc_send('openFile', file)
                    doAction('item_dbclick', dom)
                }
            },

            localFolder_item_linked(){ // 设置链接
                // toast('链接中...')
                let data = {}
                g_detail.selected_items.forEach(item => {
                    let {file, size, birthtime} = item
                    let md5 = nodejs.files.getFileMd5(file)
                    data[md5] = {
                        link: file, file, birthtime, size,
                    }
                })
                g_data.data_import(data).then(({added, error}) => {
                    added = added.length
                    error = error.length
                    added > 0 && toast('成功新增'+added+'个链接文件！', 'success') & g_datalist.tab_refresh()
                    error > 0 && toast(error+'个链接文件失败！', 'danger')
                })
            },

            async localFolder_item_unlinked(){ // 取消链接
                // toast('取消链接中...')
                let cnt = (await Promise.all(g_detail.selected_items
                .filter(item => item.data).map(item => g_item.item_toTrash(item.md5, true)))).length

                toast('成功取消'+cnt+'个链接文件！', 'success')
                g_datalist.tab_refresh()
            },
        })

        let dropdown_id = 'actions_' + _type
        _inst.registerInst(_type, {
            dropdown_id,
            showFolder: this.showFolder,
        })

        g_dropdown.register(dropdown_id, {
            position: 'top-end',
            offsetLeft: 5,
            dataKey: dom => dom.parents('.list-group').find('[data-name]').data('name'),
            list: {
                edit: {
                    title: '编辑',
                    icon: 'pencil',
                    action: _type + '_edit',
                },
                openFolder: {
                    title: '定位',
                    icon: 'folder',
                    action: _type + '_openFolder',
                },
                remove: {
                    title: '从列表移除',
                    icon: 'x',
                    class: 'text-danger',
                    action: _type + '_remove',
                },
            }
        })

        let actions = ['openFolder', 'remove', 'edit'].map(k => _type+'_'+k)
        g_action.registerAction(actions, (dom, action) => {
            let key = g_dropdown.getValue(dropdown_id)
            let item = _inst.get(key)
            g_dropdown.hide(dropdown_id)
            switch(actions.indexOf(action[0])){
                case 0:
                    return ipc_send('openFile', item.path)
                case 1:
                    return _inst.remove(key)
                case 2:
                    return this.modal_edit(key)
            }
        })
    },

    modal_edit(id) {
        let inst = g_speicalFolder
        let d = inst.get(id) ?? {
            title: '',
            path: '',
            icon: 'folder'
        }
        g_form.confirm1({
            id: 'localFolder_edit',
            elements: {
                title: {
                    title: '名称',
                    value: d.title,
                },
                path: {
                    title: '目录',
                    type: 'file_chooser',
                    required: true,
                    opts: {
                        title: '选择目录位置',
                        properties: ['openDirectory'],
                    },
                    value: d.path,
                },
                icon: {
                    title: '图标',
                    type: 'icon',
                    value: d.icon,
                }
            },
            title: '设置目录',
            btn_ok: '保存',
            callback: ({vals}) => {
                vals.path = vals.path + '/'
                inst.set(id, vals)
                toast('保存成功！', 'success')
            }
        })
    },

    showFolder(id) {
        let {path} = g_speicalFolder.get(id)
        let {dir, name} = nodejs.path.parse(path)
        g_datalist.tab_new({
            title: name,
            icon: 'folders',
            view: 'localFolder',
            sqlite: {
                opts: {
                    type: 'localFolder',
                    root: path,
                }
            }
        })
    }
}).init()

g_datalist.view_register('localFolder', {
    init(){
        let view = '.datalist[data-view="localFolder"]'
        let item = '.datalist-item'
        g_style.addStyle('view_localFolder', `
          ${view} ${item} img {
            height: 50px;
          }  
        `)
    },
    noMore: `
    <tr class="nomore text-center">
      <td colspan="3">没有更多了...</td>
    </tr>
    `,
    container: opts => {
        let {sqlite} = opts.data
        let {current, root} = sqlite.opts;
        let arr = []
        let breadPaths = ['...', ...current.replace(root, '').split('/')].map(folderName => {
            if(folderName == '') return ''
            if(folderName != '...') arr.push(folderName)
            let li = `
            <li class="breadcrumb-item">
                <a href="#" data-action="localFolder_item_folder" data-file="${root}${[...arr, ''].join('/')}">${folderName}</a>
            </li>`
            return li
        }).join('')
        return `
            <div class="datalist table-responsive overflow-y-auto" style="height: calc(100vh - 100px);" data-view="localFolder">
            <ol class="breadcrumb mb-2">${breadPaths}</ol>
              <table class="table table-vcenter card-table">
                <thead>
                  <tr>
                    <th width="100px"></th>
                    <th>标题</th>
                    <th>大小</th>
                    <th>扩展</th>
                    <th class="w-1">日期</th>
                  </tr>
                </thead>
                <tbody onScroll="g_datalist.onScroll(this)" class="datalist-items p-2"></tbody>
              </table>
            </div>
          `
    },
    async item(d) {
        let {cover, title, size, birthtime, type, file, data} = d
        let isFolder = type == 'folder'
        return `
            <tr class="datalist-item cursor-pointer  ${data ? 'table-success' : ''}" data-action="localFolder_item_${type}" data-dbclick="localFolder_item_dbClick" {md5} {dargable}>
              <th class="card-preview">
                <img src="${cover}" class="thumb" {preview}>
              </th>
              <td class="text-muted">${title}</td>
              <td class="text-muted">${isFolder ? '' : renderSize(size)}</td>
              <td class="text-muted">${isFolder ? '' : getExtName(title)}</td>
              <td class="text-muted">${getFormatedTime(5, birthtime)}</td>
            </tr>
        `
    }
})