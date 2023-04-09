


g_client.registerRevice({
    async db_connected(data) {
        let first = g_db.first == undefined
        if(first) data.first = g_db.first = 1
            
        g_plugin.callEvent('db_connected', data)
        // 第一次连接数据库（刷新不触发）
        switch (data.opts.type) {
            case DB_TYPE_DEFAULT:
                first && g_db.onFirstConnected(data)
                break

            case DB_TYPE_IMPORT:
                // 外部其他软件(billfish)的数据库..
                g_pp.call('db_imported', data)
                break

            case DB_TYPE_METADATA:
                break
        }
    },

    // 获取所有标签
    tags() {
        g_client.send('tags', g_tags.list.map(item => item.title))
    },

    data_import({ items, id }) {
        // 只包含文件地址和一些基础属性，还是需要解析媒体属性
        g_data.file_revice(items).then().then(added => {
            g_client.send('importResult', { id, added: added.length })
        })
    },

})