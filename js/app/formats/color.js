$(function() {
    const doSearch = rgb => {
        searchColor(rgb).then(items => {
            g_datalist.tab_setItems(items)
        })
    }

    const searchColor = (rgb, max = 70) => {
        return searchColorBySqlite(new SQL_builder({
            method: 'select',
            search: 'files.md5, color_meta.color',
            table: 'color_meta',
            args: { color: 'JOIN files ON color_meta.fid = files.id' },
            where: { color: 'color_meta.fid IN (SELECT fid FROM color_meta)' }
        }), rgb, max)
    }

    const searchColorBySqlite = (sqlite, rgb, max = 70) => {
        return new Promise(reslove => {
            g_data.all(sqlite.toString()).then(items => {
                let r = []
                items.forEach(({ md5, color }) => {
                    let val = deltaE(color.split('|')[0].split(','), rgb)
                    if (val <= max) r.push({ md5, val })
                })
                reslove(r.sort((a, b) => a.val - b.val))
            })
        })
    }

    g_action.registerAction('color_search', dom => doSearch(dom.title.split(',')))

    g_db.db.exec(`
     CREATE TABLE IF NOT EXISTS color_meta(
         fid      INTEGER PRIMARY KEY,
         color   TEXT
     );`)
    g_data.table_indexs.color_meta = ['fid', 'color']

    const removeColor = (fid) => g_data.data_remove2({table: 'color_meta', key: 'fid', value: fid})
    const setColor = (fid, color) => g_data.data_set2({ table: 'color_meta', key: 'fid', value: fid, data: { fid, color } })
    const getColor = async d => obj_From_key(await g_data.getMetaInfo(d, 'color'), 'color').color
    const loadColor = (md5, img) => {
        if (getFileName(img) == 'cover.jpg') {
            // 获取色卡
            getColors(img, { count: 9 }).then(color => g_item.item_setColors(md5, color))
        }
    }
    g_detail.inst.color = { set: setColor, get: getColor, load: loadColor, remove: removeColor, searchColor, doSearch }

    g_plugin.registerEvent('onBeforeShowingDetail', ({ items, columns }) => {
        if (items.length == 1 && ['video', 'image'].includes(g_format.getFileType(items[0].title))) {
            columns.color = {
                async html(d) {
                    let h = ''
                    let colors = await getColor(d)
                    if (!isEmpty(colors)) {
                        h = colors.split('|').map(color => `<div class="color flex-fill" data-action="color_search" style="background-color: rgb(${color})" title="${color}"></div>`).join('')
                    } else {
                        // 侧边展示色卡丢失，生成色卡
                        loadColor(d.md5, await g_item.item_getVal('cover', d.md5))
                        h = '<h3 class="text-center">loading...</h3>'
                    }
                    return `<div class="d-flex w-full" style="height: 30px">${h}</div>`
                },
            }
        }
    })

    // 封面更新
    g_plugin.registerEvent('image.saveCover', ({ md5, img }) => loadColor(md5, img))

    g_plugin.registerEvent('db_afterInsert', ({ opts, ret, meta, method }) => {
        let fid = ret.lastInsertRowid
        if (fid > 0 && method == 'insert' && opts.table == 'files' && ['video', 'image'].includes(g_format.getFileType(opts.data.title))) {
            if(meta && meta.colors) setColor(fid, meta.colors.join('|'))
        }
    })

    g_item.item_setColors = function(md5, colors) {
        g_data.data_getID(md5).then(fid => {
            if (fid != undefined) {
                setColor(fid, colors.map(color => color.rgb()).join('|'))
                g_detail.updateColumns('color') // 更新色卡显示
            }
        })
    }
});