// ==UserScript==
// @name    格式转化
// @version    1.0
// @author    hunmer
// @icon      arrows-random:cyan
// @description    实现视频音频图片简单转换
// @updateURL    https://neysummer2000.fun/mCollection/scripts/格式转化.js
// @namespace    6422d117-4e5b-4c37-8c40-43b583f10291

// ==/UserScript==


(() => {
    var _mgr = new Queue('convert', {
        max: 1,
        interval: 1000,
        autoRunning: false,
        onUpdate({ waittings, runnings, errors, completed }) {
            $('#convert_status').html(`<span class="text-warning">【${waittings.length}】</span>等待中<span class="text-info">【${runnings.length}】</span>运行中<span class="text-success">【${completed.length}】</span>已完成<span class="text-danger">【${errors.length}】</span>错误`)
        },
        onRemove: md5 => _getElement(md5).remove()
    })
    
    g_menu.list['datalist_item'].items.push(...[{
        text: '转换格式',
        icon: 'arrows-random',
        action: 'convert_setSource'
    }])
    

    const _getElements = (selector = '') => g_modal.modal_get('modal_convert').find('tr'+selector)
    const _getElement = (md5, selector = '') => _getElements(`[data-key="${md5}"]${selector}`)
    const _setItemStatus = (md5, text) =>  _getElement(md5, ' td:eq(3)').text(text)

    const _updateTable = () => g_form.update('modal_convert', 'table') // 更新显示
    const _reset = () => {
        _mgr.clear(true)
        $('#badge_convert').remove()
        g_modal.remove('modal_convert')
    }
    const _log = msg => g_form.getElement('modal_convert', 'log').find('pre').append('<p>'+msg+'</p>')

    g_input.bind('convert_select', ({val, e}) => {
        let md5 = getParentData(e.target, 'key')
        console.log(md5)
        _mgr.setVal(md5, 'format', val)
    })
    // 展示选中列表
    const showModal = () => {
        g_modal.modal_get('modal_convert')

        g_form.confirm1({
            id: 'modal_convert',
            title: '格式转换列表',
            elements: {
                table: {
                    type: 'html',
                    props: `style="max-height: 400px;overflow-y: auto;"`,
                    value(){
                        let items = {}
                        _mgr.values().forEach(({md5, file, status, meta, type, format}, i) => {
                            let title = getFileName(file)
                            let done = status == TASK_COMPLETED
                            let {width, height, duration} = meta ?? {}
                            items[md5] = {
                                row: [
                                    i+1,
                                    title,
                                    `${width ? `分辨率:${width}x${height}` : ''} ${duration ? ` 时长:${duration}秒` : ''}`,
                                    g_tabler.build_select({list: g_format.category[type], value: format, name: 'convert_select'}),
                                    _mgr.toStauts(status)
                                ],
                                class: done ? 'table-success' : '',
                                props: `data-file="${file}" draggable="true"`,
                            }
                        })
                        return g_tabler.build_table({
                            items,
                            id: 'convert_table',
                            headerClass: 'sticky-top',
                            headers: [{title: '*'}, {title: '文件名'}, {title: '信息'}, {title: '目标格式'}, {title: '状态'}],
                        })
                    }
                },
                btnlist: {
                    type: 'html',
                    value: `
                    <div class="d-flex align-items-center text-center w-full">
                        <div>
                            <button class="btn btn-pill" data-action="convert_switch">开始</button>
                            <button class="btn btn-pill" data-action="convert_clearComepleted">清除已完成</button>
                        </div>
                        <div class="ms-auto">
                            <label class="form-label">最大任务</label>
                           <input class="form-control" data-input="convert_setMax" type="number" id="tentacles" min="1" max="10" value="1">
                        </div>
                    </div>
                    `
                },
                cmd: {
                    title: '自定义执行参数(一行一组参数)',
                    type: 'textarea',
                    value: '',
                    help: `
                        <p>-fs 100M -- 指定文件大小</p>
                        <p>-crf 0-100 -- 视频质量</p>
                        <p>-vf 'scale=trunc(iw/4)*2:trunc(ih/4)*2'-- 缩放二分之一分辨率</p>
                        <p>-vf scale=宽度:-1  -- 根据目标宽度自适应缩放</p>
                    `,
                    placeHolder: ''
                },
                log: {
                    type: 'html',
                    value: `
                    <pre>
                        <p id="convert_status">等待用户开始转换...</p>
                        <div class="hr-text m-1">输出</div>
                    </pre>`,
                },
            },
        }, {
            buttons: [{
                text: '清空',
                class: 'btn-danger',
                onClick: () => _reset(),
            }],
            once: false,
            width: '80%',
            overwrite: false,
            scrollable: true,
        })
    }

    let items = [{
        text: '应用同类型',
        action: 'convert_applyWithFormat'
    }, {
        text: '应用同格式',
        action: 'convert_applyWithExt'
    }, {
        icon: 'x',
        text: '从列表删除',
        class: 'text-danger',
        action: 'convert_item_remove'
    }]
    let actions = items.map(item => item.action)
    g_menu.registerMenu({
        name: 'convert_item',
        selector: `#convert_table tr`,
        dataKey: 'data-key',
        items
    })
    g_action.registerAction(actions, (dom, action) => {
        let key = g_menu.key
        let {type, format, file} = _mgr.get(key)
        g_menu.hideMenu('convert_item')
        switch(actions.indexOf(action[0])){
            case 0:
                return _mgr.for((id, item) => {
                    if(item.status == TASK_WAITTING && item.type == type){
                        item.format = format
                        _getElement(id, ' .form-select').val(format)
                    }
                })

            case 1:
                let ext = getExtName(file)
                return _mgr.for((id, item) => {
                    if(item.status == TASK_WAITTING && getExtName(item.file) == ext){
                        item.format = format
                        _getElement(id, ' .form-select').val(format)
                    }
                })
            
            case 2:
                return _mgr.remove(key)
        }
    })

    g_action.registerAction({
        convert_setMax: dom => _mgr.opts.max = parseInt(dom.value),
        convert_switch: dom => {
            _mgr.setRunning()
            dom.innerText = _mgr.isRunning() ? '暂停' : '开始'
        },
        convert_clearComepleted: () => {
            _mgr.getListStatus()[TASK_COMPLETED].forEach(id => _mgr.remove(id))
            _updateTable()
        },
        convert_convertList: () => showModal(),
        convert_setSource: async () => {

            let cnt = 0
           await Promise.all(g_detail.getSelectedKeys().map(async md5 => {
                if(_mgr.get(md5)) return

                let data = await g_data.data_get(md5)
                let file = await g_item.item_getVal('file', data)
                let type = g_format.getFileType(file)
                if(!['image', 'video', 'audio'].includes(type)) return

                _mgr.add(md5, {
                    md5, file, type,
                    meta: await g_detail.inst.media.get(data),
                    onStatusChange(status, cb) {
                        let {file, meta, md5} = this
                        if (status == TASK_RUNNING) {
                            let format = this.format = _getElement(md5, ' .form-select').val()
                            let output =  file + '.' + format
                            // if(format == getExtName(file))
                            const onError = err => {
                                _log(`<span class="text-danger">【转换失败】</span>${err}`)
                                cb(TASK_ERROR)
                            }
                            let ffmpeg = new nodejs.cli.ffmpeg(file, { 
                                args: g_form.getInputVal('modal_convert', 'cmd').split("\n"),
                                progress: true
                            })
                            .on('start', cmd => _setItemStatus(md5, '运行中'))
                            .on('progress', progress => {
                                let duration = meta.duration
                                if(duration > 0){
                                    progress = parseInt(toTime(progress) / duration * 100)
                                    _setItemStatus(md5, progress + '%')
                                }
                            })
                            .on('error', onError)
                            .on('end', str => {
                                
                                
                                g_data.data_getData(md5).then(async data => {
                                    // TODO 判断转换完的文件是否同等时长
                                    let {dir, name} = nodejs.path.parse(file)
                                    let fileName = name + '.' + format
                                    let newFile =  dir + '/'+ fileName
                                    let oldSize = nodejs.fs.statSync(file).size
                                    let newSize = nodejs.fs.statSync(output).size
                                    if(newSize == 0) return onError('文件转换失败！未知文件大小！')

                                    nodejs.fs.removeSync(file)
                                    nodejs.fs.renameSync(output, newFile)
                                    data.title = fileName
                                    if(!isEmpty(data.link)) data.link = newFile
                                    
                                    await g_data.data_setData(data)
                                    g_item.item_update(data)
                                    _log(`<span class="text-success">【转换成功】</span>${getFileName(file)} -> ${format} 大小：${renderSize(newSize)}(${parseInt(newSize / oldSize * 100)}%)`)
                                })
                                cb(TASK_COMPLETED)
                            })
                            .save(output)
                        }
                        _setItemStatus(md5, _mgr.toStauts(status))
                    }
                })
                cnt++
            }))
            
            if(cnt){
                insertEl({tag: 'span', text: '', props: { id: 'badge_convert', class: 'badge bg-primary me-2', 'data-action': 'convert_convertList'}}, {target: $('#traffic'), method: 'prependTo'})
                .html(`<i class="ti ti-arrows-random fs-5 me-2"></i>${_mgr.count()}`)
                toast('成功添加'+cnt+'个文件', 'success')
                showModal()
            }
            g_menu.hideMenu('datalist_item')
        }
    })

})()

