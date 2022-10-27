g_client.registerRevice({
    db_connected: async (data) => {
        console.log('db_connected', data)
        // 第一次连接数据库（刷新不触发）
   		// g_tags.tags = Object.keys(await g_tags.tag_fetchAll())
    },
})