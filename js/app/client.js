g_client.registerRevice({
    async db_connected(data) {
        console.log('db_connected', data)
        // 第一次连接数据库（刷新不触发）
        g_tags.tags = Object.keys(await g_tags.tag_fetchAll())

        // fetch("http://localhost:41597/api/item/addFromPaths", {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json'
        //             // 'Content-Type': 'application/x-www-form-urlencoded',
        //         },
        //         body: JSON.stringify({
        //             items: [{
        //                 path: 'I:\\software\\videoManager\\resources\\app\\cuts\\1666930183179.mp4',
        //                 name: '1666930183179.mp4',
        //                 tags: ['tag1', 'tag2'],
        //             }, {
        //                 path: 'I:\\software\\videoManager\\resources\\app\\cuts\\1666929924762.mp4',
        //                 name: '1666929924762.mp4',
        //                 tags: ['tag1', 'tag2'],
        //             }, {
        //                 path: 'I:\\software\\videoManager\\resources\\app\\cuts\\1666925184266.mp4',
        //                 name: '1666925184266.mp4',
        //                 tags: ['tag1', 'tag2'],
        //             }]
        //         }),
        //     })
        //     .then(response => response.json())
        //     .then(result => {
        //         console.log(result)
        //     })
        //     .catch(error => console.log('导入失败,请确保eagle在后台运行!'));

    },

    // 获取所有标签
    tags(){
        g_client.send('tags', g_tags.tags)
    },

    data_import({items, id}) {
        // 只包含文件地址和一些基础属性，还是需要解析媒体属性
        g_data.file_revice(items).then().then(added => {
            g_client.send('importResult', {id, added: added.length})            
        })
    },

})

