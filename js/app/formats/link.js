(() => {
     g_plugin.registerEvent('db_connected', ({db}) => {
        db.exec(`
        CREATE TABLE IF NOT EXISTS url_meta(
            fid  INTEGER PRIMARY KEY,
            url TEXT
        );`)
    })
    g_data.table_indexs.url_meta = ['fid', 'url']
    const removeURL = (fid) => g_data.data_remove2({table: 'url_meta', key: 'fid', value: fid})
    const setURL = (fid, url) => g_data.data_set2({ table: 'url_meta', key: 'fid', value: fid, data: { fid, url } })
    const getURL = async d => obj_From_key(await g_data.getMetaInfo(d, 'url'), 'url').url

    g_detail.inst.url = {set: setURL, get: getURL, remove: removeURL}

    g_plugin.registerEvent('onBeforeShowingDetail', ({ columns }) => {
        columns.url = {
            multi: true,
            async html(items) {
                let url = items.length == 1 ? await getURL(items[0]) : ''
                return `
                <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text" id="inputGroup-sizing-sm" data-action="detail_url">
                    <i class="ti ti-link"></i>
                    </span>
                    <input type="text" data-input="detailChanged,url" data-change="detailChanged,url" placeholder="https://" class="form-control form-control-flush border-hover"  value="${url || ''}">
                </div>`
            },
        }
    })

    g_plugin.registerEvent('item.detail.changed.url', ({ list, val }) => {
        list.forEach(async md5 => {
            let fid = await g_data.data_getID(md5)
            setURL(fid, val)
        })
    })

    g_plugin.registerEvent('db_afterInsert', ({ opts, ret, meta, method }) => {
        let fid = ret.lastInsertRowid
        if (fid > 0 && meta && method == 'insert' && opts.table == 'files' && !isEmpty(meta.url)) {
             setURL(fid, meta.url)
        }
    })

})()