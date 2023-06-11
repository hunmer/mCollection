// ==UserScript==
// @name        临时数据库
// @namespace   adca6359-5970-4172-90af-08d95e1708ee
// @version     0.0.1
// @author      hunmer
// @description 临时解决数据库被占用问题
// @primary     1
// ==/UserScript==
(() => {
    let prefix = '//192.168.31.3/影视'
    g_plugin.registerEvent('db_switch', data => {
        let { name, opts } = data
        if(opts.path == prefix && !opts.file){
            nodejs.files.exists = file =>  file.startsWith(prefix) ? true : nodejs.fs.existsSync(file)
            
            let saveTo = nodejs.dir+'/cache/'+name+'.db'
            nodejs.files.copySync(opts.path+'/items.db', saveTo)
            data.opts.file = saveTo
        }
    })
})()
