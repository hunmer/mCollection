var g_data = {

    // 取所有视频数
    async getLengths(query, table = 'videos') {
        let r = await this.get(`SELECT COUNT(*) FROM ${table} ${query}`)
        return r ? r['COUNT(*)'] : 0;
    },
    // md5是否存在
    async data_exists(md5) {
        let i = await this.getLengths(`WHERE md5='${md5}'`)
        return i > 0
    },
    // 删除
    data_remove(md5, table = 'videos') {
        return this.run(`DELETE FROM ${table} WHERE md5=?`, md5);
    },
    // 移动到垃圾桶
    data_toTrash(md5, remove = true) {
        return this.date_setVal(md5, 'deleted', remove ? 1 : 0)
    },
    // 是否在垃圾桶
    async data_isTrashed(md5) {
        return await this.data_getVal(md5, 'deleted') === 1
    },
  
    // 取结果
    get(query, ...args) {
        return  this.db.prepare(query).get(args);
    },

    // 取结果
    // TODO 没连接db之前禁止这些操作
    async all(query, ...args) {
        return this.db ? await this.db.prepare(query).all(args) : [];
    },

    // 执行操作
     run(query, ...args) {
        return  this.db.prepare(query).run(...args);
    },

    // 指定md5保存数据
    data_set(md5, data, table = 'videos') {
        data = this.data_format(data)
        // data.md5 = md5
        let keys = Object.keys(data);
        let s = '';
        keys.every((key, i) => {
            s += key + ' = ?';
            if (i != keys.length - 1) {
                s += ','
            }
            return true;
        });
        return this.run(`UPDATE ${table} SET ${s} WHERE md5=?`, Object.values(data).concat(md5));
    },

    // 适用于改一次值
    async date_setVal(d, k, v) {
        d = await this.data_getData(d)
        setObjVal(d, k, v)
        return this.data_setData(d)
    },

    async data_getVal(d, k, defV) {
        d = await this.data_getData(d)
        return getObjVal(d, k, defV)
    },

    // 保证设置数据
    async data_set1(md5, data) {
        return await this.data_set(md5, data).changes || await this.data_add(data).changes
    },

    // 保存数据
    data_setData(data) {
        if (data.md5) {
            return this.data_set(data.md5, data)
        }
    },

    // 返回查询结果
    data_getResults(query) {
        return this.all(query);
    },

    async data_getData(md5) {
        return typeof(md5) == 'object' ? md5 : await this.data_get(md5)
    },

    data_getData1(md5, callback){
        if(typeof(md5) == 'object') return callback(md5)
        this.data_get(md5).then(data => callback(data))
    },

    // 数组增减多个
    async data_arr_changes(data, key, added, removed) {
        data = await this.data_getData(data)
        added.forEach(add => {
            if (!data[key].includes(add)) data[key].push(add)
        })
        removed.forEach(remove => {
            let i = data[key].indexOf(remove)
            if (i != -1) data[key].splice(i, 1)
        })
        this.data_setData(data)
    },

    // 数组增减单个
    async data_arr_toggle(data, key, folder, add = true) {
        data = await this.data_getData(data)
        let i = data[key].indexOf(folder)
        let exists = i == -1
        if (add == undefined) add = !exists
        if (add) {
            data[key].push(folder)
        } else {
            data[key].splice(i, 1)
        }
        await this.data_setData(data)
        // TODO 更新当前过滤 ()
        return add
    },


    page_toPage() {

    },

    // 获取视频数据
    async data_get(md5, table = 'videos') {
        let data = await this.get(`select * from ${table} where md5=?`, md5);
        if (data) return this.data_parse(data)
    },

    deepProxy(Obj, callback) {
        // 深度遍历
        if (typeof Obj === 'object') {
            const status = Array.isArray(Obj);
            if (status) {
                Obj.forEach((v, i) => {
                    if (typeof v === 'object') {
                        Obj[i] = this.deepProxy(v, callback)
                    }
                })
            } else {
                Object.keys(Obj).forEach(v => {
                    if (typeof Obj[v] === 'object') {
                        Obj[v] = this.deepProxy(Obj[v], callback)
                    }
                });
            }
            return new Proxy(Obj, {
                set(target, key, val) {
                    if (target[key] !== val) { // 数据变动
                        Reflect.set(target, key, val)
                        callback(target, key, val)
                    }
                }
            }); // 数据代理
        }
        return new TypeError("Argument must be object or array");
    },

    // 返回一个改动就自动保存的对象
    async data_handle(md5) {
        let data = await this.data_get(md5)
        // 对象里的对象不能Pro
        return this.deepProxy(data, (target, key, val) => {
            // console.log(data)
            g_data.data_setData(data)
        })
    },

    init(funs = {}) {
        const self = this
        let init = funs.init
        if(init){
            funs.init.apply(this)
            delete funs.init
        }
        Object.assign(this, funs)
        return this
    },

    // 文件列表转成对象
    async file_revice(files, obj = true) {
        let r = obj ? {} : []

        for (let file of files) {
            file = file.replaceAll('\\', '//') // 替换正确路径
            let { birthtimeMs, isFile, size } = nodejs.files.stat(file)
            if (!isFile) continue;

            let json = {}
            // TODO 简单判断是否为媒体文件
            let meta = await g_ffmpeg.video_meta(file)
            if (meta && meta.streams) {
                json.duration = meta.format.duration * 1
                json.format = meta.format.format_long_name
                json.width = meta.streams[0].coded_width
                json.height = meta.streams[0].coded_height
                json.frame = meta.streams[0].avg_frame_rate
            }
            let d = {
                file: file,
                json: json,
                birthtime: parseInt(birthtimeMs),
                size: parseInt(size),
            }
            obj ? r[nodejs.files.getFileMd5(file)] = d : r.push(d)
            
        }
        this.data_import(r)
    },

    // 对象格式化至可以插入SQL
    data_format(data) {
        console.log(data);
        let d = copyObj(data)
        d.tags = arr_join(d.tags)
        d.folders = arr_join(d.folders)
        d.json = JSON.stringify(d.json)
        return d
    },

    // 把文本数据解析成对象OR数组
    data_parse(d) {
        if (typeof(d.tags) == 'string') d.tags = d.tags.split('||').filter(s => s.length)
        if (typeof(d.folders) == 'string') d.folders = d.folders.split('||').filter(s => s.length)
        if (typeof(d.json) == 'string') d.json = JSON.parse(d.json)
        return d
    },

}

function arr_join(arr, join = '||') {
    let s = (arr || []).join(join)
    return s == '' ? s : join + s + join
}

// 修复父目录不存在
// g_folder.entries((k, v) => {
//     if(!isEmpty(v.parent) && !g_folder.folder_exists(v.parent)){
//         g_folder.folder_set(v.parent)
//     }
// })

module.exports = g_data