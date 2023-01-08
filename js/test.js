g_plugin.
registerEvent('db_load', data => {
    // todo isNew 参数
    console.log(data.name + '数据库完成加载!')
    return;
    setTimeout(() => {
        let d = {};
        let file = [];
        for (let id of ['1661100201363', '1663218826220', '1660754459533', '1660754446334']) {
            file.push('X:\\aaa\\videos\\' + id + '.mp4');
        }
        g_data.file_revice(file);
    }, 1000)

}, 1)