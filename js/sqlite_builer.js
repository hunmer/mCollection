class SQL_builder {

    constructor(opts) {
        if(opts instanceof SQL_builder) return opts

        if(opts.opts) opts = opts.opts // json格式化对象转成class
        this.opts = Object.assign({
            where: {},
            args: {},
            where_do: {},
        }, opts)
    }

    // 设置属性
    setOption(k, v) {
        if (typeof(k) == 'object') {
            Object.assign(this.opts, k)
        } else {
            this.opts[k] = v
        }
        return this
    }

    // 获取属性
    getOption(k) {
        return this.opts[k]
    }

    // 获取全部属性
    getOptions() {
        return this.opts
    }

    // 移除属性
    removeOption(attr, key){
        if(typeof(key) == 'function'){
            key = Object.entries(this.opts[attr]).filter(key).map(([k]) => k)
        }else{
            key = toArr(key)
        }
        key.forEach(k => delete this.opts[attr][k])
        return this
    }

    // 属性名是否存在
    checkOption(attr, key){
        if(typeof(key) == 'function'){
            key = Object.entries(this.opts[attr]).filter(key).map(([k]) => k)
        }else{
            key = toArr(key)
        }
        let exists = Object.keys(this.opts[attr])
        // if(typeof(key) == 'number'){
        //     return exists.length >= key
        // }
        return arr_equal(key, exists)
    }


    // 添加属性到数组
    addValue(k, v){
        let arr = toArr(this.opts[k])
        if(!arr.includes(v)){
            arr.push(v)
            this.opts[k] = arr
        }
        return this
    }

    // 克隆对象
    clone(){
        return new SQL_builder(this.getOptions())
    }

    // 合并属性
    assignValue(k, v){
        let attr = this.opts[k]
        if(typeof(attr) == 'object'){
            Object.assign(attr, v)
        }
        return this
    }

    async all(count = false){
        let all = this.getOption('all')
        let row
        if(all){
            row = await all()
            if(count) return row.length
        }else{
            if(count) return (await g_data.get(this.clone().setOption('search', 'COUNT(*)').toString()))['COUNT(*)']
            row = await g_data.all(this.toString())
        }
        return row
    }

    // 格式化文本
    toString(skip = []) {
        let { method, search, table, where, limit, order, data, args, where_do } = this.getOptions()

        if (data) {
            var indexs = g_data.table_getIndexs(table)
            var { list, key } = data
            var keys = Object.keys(data).filter(k => indexs.includes(k))
        }

        let temp = ''
        if(!skip.includes('where')){
            where = Object.entries(where).sort() // 保证名称排序，不然会影响匹配
            let len = where.length
            where.forEach(([k, v], i) => {
                let temp1 = toVal(v, data)
                let lasted = i == len - 1
                temp += temp1
                let end = ['AND', 'OR'].find(s => temp1.endsWith(s))
                if(!end){ 
                    if(!lasted){
                        let name = Object.keys(where_do).find(k1 => k.startsWith(k1))
                        temp += ' ' + (name ? toVal(where_do[name]) : 'AND') + ' ' 
                    }
                }else{
                    //如果语句是以 OR AND 等等结尾的就不添加。。
                    if(lasted) temp = temp.substring(0, temp.length - end.length) // 替换掉结尾多出来的...
                    temp += ' '
                }
            })
            where = (len ? 'WHERE ' : '') + temp
        }else{
            where = ''
        }

        args = Object.values(args)
        if(args.length) args = args.join(' ')

        if(order) order = 'ORDER BY ' + order
        if(limit) limit = 'LIMIT ' + parseInt(limit)

        let s
        switch (method) {
            case 'select':
                s = `SELECT %search% FROM %table% %args% %where% %order% %limit%`
                break;

            case 'delete':
                s = `DELETE FROM %table% %args% %where%`

            case 'insert':
                s = `INSERT INTO %table% (${keys.join(',')}) VALUES (${keys.map(_k=>'@' + _k).join(',')})`

            case 'update':
                s = `UPDATE %table% SET ${g_data.format_keys(list, key, indexs)} %args% %where%`
        }
        if (s) return formatText(s, { method, search, table, where, limit, order, args, data })
    }

    equal(obj, skip = []){
        return JSON.stringify(obj) == JSON.stringify(this)
        // if(!obj instanceof SQL_builder) obj = new SQL_builder(obj)
        // return this.toString(skip) == obj.toString(skip)
    }
}

// let sql = new SQL_builder({
//     method: 'select',
//     search: 'id, md5',
//     table: 'files',
//     where: {folders: `files_folders.ids like '%|0|%'`, tags: `files_tags.ids like '%|0|%'`},
//     args: {folder: 'INNER JOIN files_folders ON files.id = files_folders.fid', tags: 'INNER JOIN files_tags ON files.id = files_tags.fid'},
//     limit: 20,
//     order: 'id DESC'
// })
// sql
// .assignValue('where', {folders_1: `files_folders.ids like '%|1|%`, folders_2: `files_folders.ids like '%|2|%`})
// .assignValue('where', {tags_1: `files_tags.ids like '%|1|%`, tags_2: `files_tags.ids like '%|2|%`})
// .assignValue('where_do', {folders: `AND`, tags: 'OR'})
// console.log(sql, sql.toString())

// let select = new SQL_builder({
//     method: 'select',
//     search: 'md5',
//     table: 'files',
//     where: 'deleted=0',
//     limit: 20,
//     order: 'DESC'
// })
// console.log(select.toString())


// let update = new SQL_builder({
//     method: 'update',
//     table: 'files',
//     where: 'deleted=0',
//     data: {
//         key: 'id',
//         list: {
//             id: 0,
//             title: 'titl1',
//             size: 'size1',
//         }
//     }
// })
// console.log(update.toString())


// let deleted = new SQL_builder({
//     method: 'delete',
//     table: 'files',
//     where: 'deleted=0',
// })
// console.log(deleted.toString())


// let insert = new SQL_builder({
//     method: 'insert',
//     table: 'files',
//     where: 'deleted=0',
//     data: {
//         key: 'id',
//         data: {
//             id: 0,
//             title: 'titl1',
//             size: 'size1',
//         }
//     }
// })
// console.log(insert.toString())