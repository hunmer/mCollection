// ==UserScript==
// @name    影库列表
// @version    1.0
// @author    hunmer
// @icon    movie:purple
// @updateURL    https://neysummer2000.fun/mCollection/scripts/影库列表.js
// @description    增加影库类型到特殊文件夹，支持采集影片的信息并过滤
// @namespace    115a875f-d883-4855-bf8d-8d3a77698b82

// ==/UserScript==
({

    api_searchMovie(keyword) {
        return new Promise((reslove, reject) => {
            $.getJSON("https://api.wmdb.tv/api/v1/movie/search?q=" + keyword)
                .then((data, textStatus) => {
                    if (textStatus == 'success') reslove(data)
                    reject()
                })
                .catch(() => reject())
        })
    },

    parseDetail(item) {
        let { alias, data, dateReleased, doubanId, duration, id, imdbId, originalName, type } = item
        let { country, description, genre, language, poster, shareImage } = data?.[0] || {}
        let rating = item.doubanRating ?? item.imdbRating
        let meta = {}
        if (shareImage) meta.shareImage = shareImage

        return {
            alias, rating, dateReleased, doubanId, duration, id, imdbId, originalName, type,
            country, description, genre, language, poster, meta
        }
    },

    async fetchDetail(opts) {
        let { title, dialog } = opts
        if (dialog) title = await prompt(title)
        return new Promise(reslove => {
            this.api_searchMovie(title).then(list => {
                const save = index => {
                    this.saveDetail(Object.assign(opts, { detail: list[parseInt(index)] })).then(() => reslove(true))
                }
                console.info(`搜索电影[${title}]成功！`)
                if (dialog) { // 选择影片
                    let items = list.slice(0, 9).map((item, i) => {
                        let { poster, originalName, country, dateReleased } = this.parseDetail(item)
                        return {
                            props: `data-action="activeClass,table-primary"`,
                            row: [i + 1, originalName, country, dateReleased],
                        }
                    })
                    return confirm(g_tabler.build_table({
                        items,
                        headers: [{ title: '*' }, { title: '剧名' }, { title: '国家' }, { title: '上映时间' }],
                    }), {
                        id: 'movie_search',
                        width: '80%',
                        title: '电影搜索',
                        scrollable: true,
                    }).then(() => {
                        let selected = getEle('activeClass,table-primary', '.table-primary').data('key')
                        if (selected != undefined) save(selected)
                    })
                }
                save(0)
            }, () => console.error(`搜索电影[${title}]失败！`) & reslove(false))
        })
    },

    saveDetail(opts) {
        let { id, saveTo, md5, detail } = opts
        return g_detail.inst.movie.set(id, detail).then(async ({ changes }) => {
            let success = changes > 0
            if (success) {
                let poster = detail.data?.[0]?.poster
                if (isEmpty(poster)) return
                //写入cover
                downloadFile({
                    saveTo,
                    url: poster,
                    complete: () => {
                        g_item.item_update(md5)
                    }
                })
            }
        })
    },

    db_init() {
        g_data.table_indexs.movie_meta = ['fid', 'originalName', 'alias', 'dateReleased', 'country', 'description', 'genre', 'language', 'poster', 'type', 'doubanId', 'rating', 'duration', 'id', 'imdbId', 'meta']
        g_detail.inst.movie = {
            set: (fid, data) => {
                data.fid = fid
                data.meta = JSON.stringify(data.meta)
                return g_data.data_set2({ table: 'movie_meta', key: 'fid', value: fid, data })
            },
            get: async d => {
                let ret = obj_From_key(await g_data.getMetaInfo(d, 'movie'), 'movie')
                if (ret.meta) ret.meta = JSON.parse(ret.meta)
                return ret
            },
            remove: (fid) => g_data.data_remove2({ table: 'movie_meta', key: 'fid', value: fid }),
        }

        g_lang.adds({
            originalName: { zh: '片名' },
            alias: { zh: '别名' },
            dateReleased: { zh: '上映' },
            country: { zh: '国家' },
            language: { zh: '语言' },
            description: { zh: '注释' },
            genre: { zh: '分类' },
            type: { zh: '类型' },
            rating: { zh: '评分' },
            duration: { zh: '时长' },
        })

        g_plugin.registerEvent('db_connected', ({ db }) => {
            db.exec(`
            CREATE TABLE IF NOT EXISTS movie_meta(
                fid  INTEGER PRIMARY KEY,
                originalName VARCHAR(256),
                alias VARCHAR(3000),
                dateReleased DATETIME,
                country VARCHAR(256),
                description TEXT,
                genre VARCHAR(256),
                language VARCHAR(256),
                poster VARCHAR(1048),
                type VARCHAR(256),
                doubanId VARCHAR(256),
                rating DECIMAL(3,1),
                duration INT,
                id VARCHAR(256),
                imdbId VARCHAR(256),
                meta TEXT
            );`)
        })
    },

    init() {
        const self = this
        this.db_init()


        // 设置海报存储规则
        g_item.setItemType('poster', {
            initFile: args => args.poster = args.path + '_poster.jpg',
            getFile: args => args.poster,
            beforeCheck: () => { },
        })

        const _type = 'movieList'
        const _inst = g_speicalFolder
        g_lang.setLang('sf_' + _type, {
            zh: '影库',
            en: '',
        })

        if (!_inst.search('type', _type)) {
            _inst.add(undefined, {
                type: _type,
                title: '影库测试',
                icon: 'movie',
                path: 'C:/testMovie/',
            })
        }

        self._mgr = new Queue(_type, {
            max: 1,
            interval: 1000 * 40, // api限制
            autoRunning: false,
            onUpdate({ waittings, runnings, errors, completed }) {
                //$('#convert_status').html(`<span class="text-warning">【${waittings.length}】</span>等待中<span class="text-info">【${runnings.length}】</span>运行中<span class="text-success">【${completed.length}】</span>已完成<span class="text-danger">【${errors.length}】</span>错误`)
            }
        })
        g_dataResult.register(_type, {
            opts: { root: '' },
            toString() {
                return this.getOption('root')
            },
            async all() {
                // TODO 加载进度条
                let insert = {}
                let { root } = this.opts
                let list = (await Promise.all(
                    (await nodejs.files.dirFiles(root, ['mp4'])).map(async file => {
                        let { size, birthtimeMs: birthtime, mtimeMs, ino } = nodejs.fs.statSync(file)
                        let data = await g_data.data_get1({ table: 'files', key: 'link', value: file })
                        if (!data) {
                            console.log('新文件：' + file)
                            // 插入数据库 TODO: 过滤掉短的影片或者自定义过滤规则
                            let md5 = nodejs.files.getFileMd5(file)
                            data = { md5, link: true, file, title: getFileName(file), data, birthtime, date: mtimeMs, size }
                            insert[md5] = data
                        }
                        return Object.assign(data, await g_item.item_getVal(['cover', 'poster'], data))
                    }))).sort((a, b) => {
                        // TODO 自定义排序
                        return b.mtimeMs - a.mtimeMs
                    })

                Object.keys(insert).length && g_data.data_import(insert)
                    .then(({ added, error }) => {
                        let i_added = added.length
                        let i_error = error.length
                        i_error > 0 && toast(i_error + '个链接文件失败！', 'danger')
                        if (!i_added) return

                        toast(i_added + '个链接文件成功！', 'success')
                        added.forEach(item => {
                            self._mgr.add(item.md5, {
                                item,
                                onStatusChange(status, cb) {
                                    if (status != TASK_RUNNING) return
                                    let { title, id, md5, poster } = this.item
                                    self.fetchDetail({
                                        id, md5,
                                        saveTo: poster,
                                        title: getFileName(title, false),
                                    }).then(success => cb(success ? TASK_COMPLETED : TASK_ERROR))
                                }
                            })
                        })
                        self._mgr.setRunning(true, true)
                    })
                this.sources = [...list]
                this.items = list
                return list
            },
            parseItem(item) {
                if (typeof (item) != 'object') item = this.getItems().find(({ md5 }) => md5 == item)
                return item
            },
            async columns(items) {
                let status_list = {};
                if (items.length == 1) {
                    let detail = await g_detail.inst.movie.get(items[0].id || await g_data.data_getID(items[0].md5))
                    detail && ['originalName', 'dateReleased', 'country', 'genre', 'language', 'type', 'rating', 'duration'].map(name => {
                        status_list[name] = {
                            check: i => i == 1,
                            title: _l(name),
                            class: 'bg-' + g_tabler.color_random() + '-lt',
                            getVal: () => {
                                let val = detail[name]
                                switch (name) {
                                    case 'type':
                                        return ({ Movie: '电影', TVSeries: '电视剧' })[val]
                                    case 'duration':
                                        return getTime(val)
                                    case 'originalName':
                                        return `<a href='#' data-url="https://www.baidu.com/s?wd=${val}" title="${detail['alias']}">${val}</a>`
                                    case 'description':
                                        return `<a href='#' title="${val}">查看</a>`
                                }
                                return val
                            }
                        }
                    })
                }

                return {
                    type: 'movieList', columns: {
                        preview: {
                            multi: false,
                            html: async ([item]) => `<img data-action="detail_image" src="${await g_item.item_getVal('poster', item)}" alt="${item.title}" class="rounded p-1">`
                        },
                        status: {
                            multi: true,
                            classes: 'border-top mh-50',
                            list: {
                                ...status_list,
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
                                },
                                switch: {
                                    check: i => i == 1,
                                    title: '展示原始',
                                    class: 'bg-red-lt',
                                    primary: -12,
                                    getVal: ([d]) => `<a href='#' data-action="movieList_item_showDetail">点击查看</a>`
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
                    }, sort: ['preview', 'status']
                }
            },
        })

        g_menu.list['datalist_item'].items.push(...[{
            text: '搜索电影数据',
            action: 'item_movie_search'
        }])

        g_action.registerAction({
            movieList_item_dbClick: dom => doAction('item_dbclick', dom),
            movieList_item_showDetail: () => {
                g_detail.showList(g_detail.selected_keys, { preset: g_dataResult.get('sqlite') })
            },
            item_movie_search: () => {
                let md5 = g_menu.key
                g_menu.hideMenu('datalist_item')
                let { id, poster, title } = g_datalist.item_getData(md5)
                this.fetchDetail({
                    id: id, md5,
                    saveTo: poster,
                    dialog: true,
                    title: getFileName(title, false),
                }).then(success => {
                    toast('更新数据' + (success ? '成功' : '失败'), success ? 'success' : 'danger')
                })
            },
            input_movieFilter(dom){
                self.applyFilter(g_form.getFormID(dom)).then(ret => {
                    let ids = ret.map(({fid}) => fid)
                    let tab = getParentData(dom, 'tabContent')
                    let items = g_datalist.tab_getData('sqlite', tab).sources.filter(({id}) => ids.includes(id))
                    g_datalist.tab_setItems(items, tab, true)
                })
            }
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

        let actions = ['openFolder', 'remove', 'edit'].map(k => _type + '_' + k)
        g_action.registerAction(actions, (dom, action) => {
            let key = g_dropdown.getValue(dropdown_id)
            let item = _inst.get(key)
            g_dropdown.hide(dropdown_id)
            switch (actions.indexOf(action[0])) {
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
            id: 'movieList_edit',
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
            title: '设置电影目录',
            btn_ok: '保存',
            callback: ({ vals }) => {
                vals.type = 'movieList'
                vals.path = vals.path + '/'
                inst.set(id, vals)
                toast('保存成功！', 'success')
            }
        })
    },

    showFolder(id) {
        let { path } = g_speicalFolder.get(id)
        let { dir, name } = nodejs.path.parse(path)
        g_datalist.tab_new({
            title: name,
            icon: 'movie',
            view: 'movieList',
            sqlite: {
                opts: {
                    type: 'movieList',
                    root: path,
                }
            }
        })
    },

    async applyFilter(form_id, vals){
        vals ??= g_form.getVals(form_id)
        const check = k => !['', '无'].includes(vals[k])
        let ret = (await g_data.all('SELECT * FROM movie_meta')).filter(({country, rating, dateReleased, type, genre}) => {
            if(check('type') && type != vals.type) return false
            if(vals.rating > 0 && rating < vals.rating) return false
            if(check('country')){
                if(isEmpty(country) || !country.split(',').includes(vals.country)) return false
            }
            if(check('year')){
                if(isEmpty(dateReleased)) return false
                if(dateReleased.split('-')[0] !== vals.year) return false
            }
            if(vals.genre){
                if(isEmpty(genre) || !arr_include(vals.genre, genre.split('/'))) return false
            }
            return true
        })
        return ret
    }
}).init()

g_datalist.view_register('movieList', {
    init() {
        let view = '.datalist[data-view="movieList"]'
        let item = '.datalist-item'
        g_style.addStyle('view_movieList', `
          ${view} ${item} {
            height: 300px;
          }  

          ${view} ${item} img {
            width: 140px;
            height: 200px;
            object-fit: cover;
          }  
        `)
    },
    onInit(opts){
        // 初始化form
        let {id} = opts
        g_data.all('SELECT * FROM movie_meta').then(data => {
            let elements = {
                rating: {
                    title: '评分',
                    type: 'text',
                    value: 0,
                    props: 'type="number" min="0" max="10" step="0.1" value="1"'
                },
                type: {
                    title: '类型',
                    type: 'select',
                    value: '无',
                    list: ['无']
                },
                country: {
                    title: '国家',
                    type: 'select',
                    value: '无',
                    list: ['无']
                },
                year: {
                    title: '年份',
                    type: 'select',
                    value: '无',
                    list: ['无']
                },
                genre: {
                    title: '分类',
                    type: 'checkbox_list',
                    list: []
                },
            }
            const addTo = (k, v) => {
                if(!isEmpty(v)){
                    let list = elements[k].list
                    if(!list.includes(v)) list.push(v)
                }
            }
            data.forEach(({country, dateReleased, genre, type}) => {
                addTo('type', type)
                !isEmpty(country) && country.split(',').forEach(s => addTo('country', s))
                !isEmpty(dateReleased) && addTo('year', parseInt(dateReleased.split('-')[0]))
                !isEmpty(genre) && genre.split('/').forEach(s => addTo('genre', s))
            })
            
            for(let k in elements) elements[k].props = elements[k].props + ' data-input="input_movieFilter"'
            let div = g_form.build('form_movieFilter_'+id, {
                elements,
                target: '#form_'+id,
            }).getContainer()
        })
    },
    noMore: `
        <div class="col-12 nomore text-center">
            <h2>没有更多了...</h2>
        </div>
    `,
    container: opts => {
        return `
           <div class="datalist row overflow-y-hidden" data-view="movieList">
                <div class="col-3 movieList_form" id="form_${opts.id}"></div>
                <div class="datalist-items col-9 row row-cards align-content-start overflow-y-auto" onScroll="g_datalist.onScroll(this)" style="height: calc(100vh - 100px);"></div>
            </div>
          `
    },
    async item(d) {
        let { title, size, birthtime, file } = d
        d.poster ??= await g_item.item_getVal('poster', d)
        let cover = nodejs.files.exists(d.poster) ? d.poster : d.cover
        //  {preview} TODO: 悬浮预览只播放预告片
        return `
            <div class="col-sm-6 col-lg-4 datalist-item" data-action="movieList_item_file" data-dbclick="movieList_item_dbClick" {md5} {dargable}>
                <div class="card card-sm">
                    <a class="d-block card-preview mx-auto">
                        <img src="${cover}" class="thumb card-img-top">
                    </a>
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div>
                                <div>
                                    <span class="d-block text-truncate text-nowarp">${getFileName(title, false)}</span>
                                </div>
                                <div class="text-muted">${getFormatedTime(5, birthtime)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
})



