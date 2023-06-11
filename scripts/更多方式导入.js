// ==UserScript==
// @name    更多方式导入
// @version    1.0
// @author    hunmer
// @primary    99
// @updateURL    https://neysummer2000.fun/mCollection/scripts/更多方式导入.js
// @description    提供更多种导入方式
// @namespace    92729b13-7efd-4b7b-b389-9246fb604af3

// ==/UserScript==

(() => {

    g_dropdown.list.menu.list['import'] = {
        title: '导入',
        icon: 'package-import',
        action: 'db_import',
    }

    g_dropdown.register('db_import', {
        position: 'end-top',
        offsetLeft: 5,
        autoClose: 'true',
        parent: ['menu', 'import'],
        list: {
            db_import_folder1: {
                title: '连同目录导入',
                action: 'db_importWithFolder',
            },
        }
    })

    g_action.registerAction({
        db_importWithFolder(){
            g_form.confirm1({
                title: '连同目录导入',
                id: 'db_importWithFolder',
                elements: {
                    basePath: {
                        title: '导入目录',
                        type: 'file_chooser',
                        required: true,
                        opts: {
                            title: '选择要导入的目录',
                            properties: ['openDirectory'],
                        },
                        value: '',
                        placeholder: '点击图标选择目录',
                    },
                    skip: {
                        title: '跳过已存在目录',
                        type: 'checkbox',
                    },
                    cache: {
                        title: '保存解析缓存',
                        type: 'checkbox',
                    }
                },
                callback({vals}){
                    let {skip, cache, basePath} = vals
                    let {base, paths, files} = nodejs.files.items(basePath)
                    let r = files.map(file => {
                        return {file: base + '/' + file, meta: {folders: [nodejs.path.basename(base)]}}
                    })
                    // 遍历目录
                    let exists = g_folders.list.map(({title}) => title)
                    if(skip){
                        paths = paths.filter(path => !exists.includes(path))
                    }
                    
                    Promise.all(paths.map(async dir => {
                        (await nodejs.files.dirFiles(base+'/'+dir)).map(file => {
                            r.push({
                                file,
                                meta: {folders: [dir]}
                            })
                        })
                    })).then(() => {
                        let cacheFile = nodejs.dir+'/cache/导入缓存/'+nodejs.files.getMd5(basePath)+'.json'
                        let start = fun => fun.then(({added}) => {
                            added = added.length
                            if(added) toast('成功添加'+added+'个文件！', 'success')
                        })

                        if(cache && nodejs.files.exists(cacheFile)){
                            let cacheData = nodejs.fs.readJSONSync(cacheFile)
                            // 跳过存在目录
                            if(skip){
                                Object.entries(cacheData).forEach(([md5, item]) => {
                                    if(exists.includes(item?.meta?.folders[0])){
                                        delete cacheData[md5]
                                    }
                                })
                            }

                            Object.assign(g_data.file_cache, cacheData) // 获取本地缓存文件信息
                            return start(g_data.data_import(cacheData))
                        }
                        g_data.file_revice(r, list => {
                            cache && nodejs.files.write(cacheFile, JSON.stringify(list))
                            start(g_data.data_import(list))
                        })
                    })
                }
            })
        }
    })

})()

