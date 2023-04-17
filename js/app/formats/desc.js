(() => {
   
     g_plugin.registerEvent('db_connected', ({db}) => {
        db.exec(`
        CREATE TABLE IF NOT EXISTS desc_meta(
            fid  INTEGER PRIMARY KEY,
            desc TEXT
        );`)
    })

    g_data.table_indexs.desc_meta = ['fid', 'desc']
   const removeDesc = (fid) => g_data.data_remove2({table: 'desc_meta', key: 'fid', value: fid})
    const setDesc = (fid, desc) => g_data.data_set2({ table: 'desc_meta', key: 'fid', value: fid, data: { fid, desc } })
    const getDesc = async d => obj_From_key(await g_data.getMetaInfo(d, 'desc'), 'desc').desc
    g_detail.inst.desc = { set: setDesc, get: getDesc, remove: removeDesc }

    g_plugin.registerEvent('onBeforeShowingDetail', ({ columns }) => {
        columns.desc = {
            multi: true,
            async html(items) {
                let desc = items.length == 1 ? await getDesc(items[0]) : ''
                return `
                <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text" id="inputGroup-sizing-sm"><i class="ti ti-message-2"></i></span>
                    <textarea data-input="detailChanged,desc" data-change="detailChanged,desc" class="form-control form-control-flush border-hover" placeholder="..." rows="3" >${desc || ''}</textarea>
                </div>`
            },
        }
    })

    g_plugin.registerEvent('item.detail.changed.desc', ({ list, val }) => {
        list.forEach(async md5 => {
            let fid = await g_data.data_getID(md5)
            setDesc(fid, val)
        })
    })

    g_plugin.registerEvent('db_afterInsert', async ({ opts, ret }) => {
        let { table, data } = opts
        if (table == 'files') {
           
        }
    })
    g_plugin.registerEvent('db_afterInsert', ({ opts, ret, meta, method }) => {
        let fid = ret.lastInsertRowid
        if (fid > 0 && meta && method == 'insert' && opts.table == 'files' && !isEmpty(meta.desc)) {
             setDesc(fid, meta.desc)
        }
    })

    g_search.tabs_register('desc', {
        tab: {
            icon: 'message',
            title: '注释',
            getTabIndex: () => 4,
            html: g_search.replaceHTML(`%search_bar%<div class="search_result list-group list-group-flush p-2"></div>`)
        },
        async onSearch(s) {
            return await g_data.all(`SELECT * FROM desc_meta ${isEmpty(s) ? '' : `WHERE desc LIKE '%${s.replaceAll("'", "''")}%'`} LIMIT 30;`)
        },
        async onParse(item) {
            let data = await g_data.data_getDataByID(item.fid)
            return g_datalist.item_parse({data, view: 'list'})
        }
    })

    g_action.registerAction('search_tag_item', dom => {
        g_tags.showFolder(dom.dataset.value)
        g_search.modal.method('hide')
    })

})()