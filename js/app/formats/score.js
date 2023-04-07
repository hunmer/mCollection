$(function() {

    g_db.db.exec(`
     CREATE TABLE IF NOT EXISTS score_meta(
         fid  INTEGER PRIMARY KEY,
         score TINYINT
     );`)

    g_data.table_indexs.score_meta = ['fid', 'score']

    const removeScore = (fid) => g_data.data_remove2({table: 'score_meta', key: 'fid', value: fid})
    const setScore = (fid, score) => g_data.data_set2({ table: 'score_meta', key: 'fid', value: fid, data: { fid, score } })
    const getScore = async d => obj_From_key(await g_data.getMetaInfo(d, 'score'), 'score').score
    g_detail.inst.score = {set: setScore, get: getScore, remove: removeScore}

    g_style.addStyle('score', `
        .rating {
            font-size: 0;
            display: table;
        }

        .rating > label {
            color: #ddd;
            float: right;
        }

        .rating > label:before {
            padding: 5px;
            font-size: 16px;
            line-height: 1em;
            display: inline-block;
            content: "★";
        }

        .rating > input:checked ~ label,
        .rating:not(:checked) > label:hover,
        .rating:not(:checked) > label:hover ~ label {
            color: #FFD700;
        }

        .rating > input:checked ~ label:hover,
        .rating > label:hover ~ input:checked ~ label,
        .rating > input:checked ~ label:hover ~ label {
            opacity: 0.5;
        }
    `)

    g_plugin.registerEvent('onBeforeShowingDetail', ({ items, columns }) => {
        if (items.length == 1) {
            columns.status.list.score = {
                title: '评分',
                class: 'bg-blue-lt',
                primary: 99,
                async getVal(d) {
                    let score = await getScore(d)
                    let h = ``
                    for (let i = 5; i > 0; i--) {
                        let id = '_star'+i
                        h += `
                            <input type="radio" id="${id}" data-action="detailChanged,score" value="${i}" ${i == score ? 'checked' :''} hidden/>
                            <label for="${id}"></label>
                        `
                    }
                    return `<div class="rating">${h}</div>`
                }
            }
        }
    })

    g_plugin.registerEvent('item.detail.changed.score', ({ list, val }) => {
        list.forEach(async md5 => {
            let fid = await g_data.data_getID(md5)
            setScore(fid, val)
        })
    })

    g_plugin.registerEvent('db_afterInsert', ({ opts, ret, meta, method }) => {
        let fid = ret.lastInsertRowid
        if (fid > 0 && meta && method == 'insert' && opts.table == 'files' && meta.score > 0) {
             setScore(fid, meta.score)
        }
    })

})