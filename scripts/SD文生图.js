// ==UserScript==
// @name    SD文生图
// @version    1.0
// @author    hunmer
// @icon      pencil:primary
// @updateURL    https://neysummer2000.fun/mCollection/scripts/SD文生图.js
// @description    调用API简单实现SD文生图，并快速导入素材库
// @namespace    fa4bde38-7282-4d9d-a744-f5a9fe8c1aee

// ==/UserScript==
(() => {
    const self = this
    let _settings = getConfig('sd_settings', {
        api: 'http://127.0.0.1:7860/'
    })
    g_setting.onSetConfig('sd_settings', v => _settings = v)
    g_style.addStyle('sd', `
        .sd_image.selected {
            border: 7px solid var(--tblr-primary);
        }
    `)
    g_plugin.addToMenu('<a class="dropdown-item" data-action="sd_txt2img">SD画图</a>')

    const post = opts => {
        if(typeof(opts) != 'object') opts = {url: opts}
        opts.url = _settings.api + opts.url
        return ajax_request(opts).catch(err => getEle('sd_general').removeClass('btn-loading'))
    }

    // 切换全选
    const toggleSelectAll = () => {
        let all = $('.sd_image')
        let selected = all.filter('.selected')
        all.toggleClass('selected', selected.length == 0)
    }
    // 设置进度显示
    const setProgress = (progress, text) => {
        let hide = progress === false
        let div = $('#sd_status').toggleClass('hide1', hide)
        if(!hide){
            div.find('.progress-bar').css('width', progress + '%')
            .html(text ?? progress+'%')
        }
    }
    // 设置图片显示
    const setImage = (imgdata, index) => {
        if(isEmpty(imgdata)) return
        let target = $('#sd_result').find('.sd_image:eq('+index+')')
        target.length && target.find('img').attr('src', 'data:image/png;base64,' + imgdata)
    }

    const _refreshModelsList = (sync = false) => {
       
        post('config').then(data => {
            let cfg = getConfig('sd_config', {})
            const findByName = (find, search = 'props.elem_id') =>  data.components.find(item => getObjVal(item, search) == find)
            const updateVal = (name, index) => {
                let vals = findByName(index)
                if(vals){
                    g_form.assignElementVal('sd_txt2img', name, {list: vals.props.choices, value: sync ? vals.props.value : cfg[name]})
                }
            }
            updateVal('sampler', 'txt2img_sampling')
            updateVal('model', 'setting_sd_model_checkpoint')

            let list = []
            let lora = findByName(findByName('Lora', 'props.label').id + 1, 'id')
            for(let card of parseHtml(lora.props.value).find('.card')){
                let img = cutString(card.style.backgroundImage, './', '"')
                if(!isEmpty(img)) img = _settings.api + img
                let value = card.querySelector('.name').outerText
                list.push({
                    img,
                    value,
                    text: value,
                })
            }
            g_form.assignElementVal('sd_txt2img', 'lora', {list, value: ''})
            // updateVal('hr_upscaler', 'txt2img_hr_upscaler')
        })

        post('sdapi/v1/prompt-styles').then(async prompts => {
            let list = {}
            prompts.forEach(({name, prompt, negative_prompt}) => list[name] = {prompt, negative_prompt})
            g_form.assignElementVal('sd_txt2img', 'prompts', {list})
        })
    }
    var _lastModel
    var viewer
    var _pauseding
    var preview_ajax
    g_action.registerAction({
        sd_win: () => {
            let win = new nodejs.remote.BrowserWindow({
                width: 1450,
                height: 970,
                webPreferences: {
                    // preload: path + 'preload.js',
                    // nodeIntegration: true,
                    // contextIsolation: true,
                }
            })
            let web = win.webContents
            // win.setMenu(nodejs.remote.Menu.buildFromTemplate([{
            //     label: '菜单',
            //     submenu: [{
            //         label: '打开下载目录',
            //         click() {
            //             ipc_send('openFolder', path + 'tts\\')
            //         }
            //     }, ]
            // }]))
            win.loadURL(_settings.api)
        },
        input_sd_prompt: () => {
            let loras = []
            for(dom of getEle({input: 'input_sd_prompt'})){
                let params = matchTexts(dom.value, '<', '>')
                loras.push(...params.filter(str => str.startsWith('lora:')).map(str => str.split(':')[1]))
            }
            g_form.getInput('sd_txt2img', 'lora').tomselect.setValue(loras)
        },
        sd_general: () => {
            _pauseding = false
            let btn = getEle('sd_general')
            btn.addClass('btn-loading')

            let options, model, data
            const initData = () => {
                data = g_form.getVals('sd_txt2img')
                let extra = spliceObjectKey(data, ['model', 'size', 'resize', 'options', 'prompts'])
                model = extra.model
                options = extra.options
                let {size, resize, prompts} = extra

                let [width, height/*, hr_resize_x, hr_resize_y*/] = [...size.split('x')/*, ...resize.split('x')*/].map(val => val.replaceAll('_', '') * 1)
                let vals = {width, height/*, hr_resize_x, hr_resize_y*/}
                options.filter(n => !['keep_update'].includes(n)).forEach(option => vals[option] = true)
                setConfig('sd_config', Object.assign(data, vals))
            }
            initData()
            
            const completed = () => {
                setProgress(false)
                g_pp.clearInterval('sd_preview')
                preview_ajax && preview_ajax.abort()
                
                btn.removeClass('btn-loading')
                !nodejs.win.isFocused() && notifiMsg('AI作图', {
                    text: '图片生成完成！',
                    onclick() {
                        ipc_send('show');
                    }
                });
                toggleSelectAll()
            }
            const run = () => {

                let count = parseInt(data.n_iter)
                let imgs = Object.keys([...new Array(count)]).map(i => `
                <li class="sd_image position-relative col-${count == 1 ? 12 : 6}">
                    <a href='#' data-action="sd_fullPreview" class="position-absolute end-10 top-10">
                        <i class="text-secondary ti ti-eye" style="font-size: 3rem"></i>
                    </a>
                    <img onclick="doAction('toggleClass,selected', this.parentElement) & clearEventBubble(event)" class="w-full" src="res/loading.gif" style="object-fit: cover">
                </li>`)
                $('#sd_result').html(imgs)
                
                let done = 0
                self.ret = {info: [], images: []}

                const next = () => {
                    if(_pauseding === true) return setTimeout(() => next(), 1000)
                    if(_pauseding === -1) return completed()
                    
                    g_form.getInputVal('sd_txt2img', 'options').includes('keep_update') && initData()
                    post({
                        data: Object.assign({}, data, {
                            n_iter: 1,
                            do_not_save_grid: true,
                            prompt: data.prompt_extra + ',' + data.prompt,
                            negative_prompt: data.negative_prompt_extra + ',' + data.negative_prompt,
                        }),
                        url: "sdapi/v1/txt2img",
                    }).then(({info, images}) => {
                        self.ret.info.push(JSON.parse(info))
                        self.ret.images.push(images[0])
                        setImage(images[0], done)
                        
                        let finished = (done += 1) >= count
                        if(finished){
                            completed()
                        }else{
                            next()
                        }
                    })
                }
                next()

                let cnt = 0
                let last, lastJobNo
                g_pp.setInterval('sd_preview', () => {
                    preview_ajax && preview_ajax.abort()

                     post({
                        url: "sdapi/v1/progress?skip_current_image=false",
                        onInited: ajax => preview_ajax = ajax
                    }).then(ret => {
                        let { progress, current_image, state, eta_relative } = ret
                        let {job_timestamp} = state
                        if (progress > 0 && progress != last && !isEmpty(current_image)) {
                            if(count == 1){
                                setProgress(progress * 100, '还需'+eta_relative.toFixed(2)+'秒...')
                            }else
                            if(job_timestamp != lastJobNo){ // 进入下一张图片了
                               setProgress(++cnt / count * 100, cnt + '/' + count)
                               lastJobNo = job_timestamp
                            }
                            last = progress
                            if(cnt <= count && progress >= 0.2) setImage(current_image, cnt - 1)
                        }
                    })
                    return false
                }, 1000)
            }

            if(!isEmpty(model) && model != _lastModel){
                toast('更改模型可能要花费一些时间...')
                _lastModel = model
                post({
                    url: "sdapi/v1/options",
                    data: {"sd_model_checkpoint": model}
                }).then(err => {
                    if(err) return toast('设置模型失败！', 'danger')
                    run()
                })
            }else{
                run()
            }
        },
        sd_setPromptPreset: dom => {
            let {prompt, negative_prompt} = g_form.getElementItem('sd_txt2img', 'prompts').list[dom.value]
            g_form.setElementVal('sd_txt2img', 'prompt', prompt)
            g_form.setElementVal('sd_txt2img', 'negative_prompt', negative_prompt)
        },
        sd_settings: () => {
            g_form.confirm1({
                id: 'sd_settings',
                title: 'SD设置',
                elements: {
                    api: {
                        title: 'API地址',
                        value: _settings.api
                    }
                },
                callback: ({vals}) => {
                    vals.api ||= 'http://127.0.0.1:7860/'
                    setConfig('sd_settings', vals)
                }
            })
        },
        sd_txt2img: () => openDialog(),
        sd_refresh: () => _refreshModelsList(true),
        sd_fullPreview: dom => {
            g_preload.check('viewer', () => {
                viewer && viewer.destroy()
                viewer = new Viewer($('#sd_result')[0], {
                    title: false,
                    shown() {
                        viewer.zoomTo(1.75)
                    },
                    initialViewIndex: $(dom).parents('li').index(),
                })
                viewer.show()
            })
        },
        sd_pause: () => {
            _pauseding = !_pauseding
            getEle('sd_pause').text(_pauseding ? '恢复' : '暂停')
        },
        sd_cancel: () => _pauseding = -1,
    })

    // post('config').then(console.log)
    // openDialog()

    function openDialog(){
        let data =Object.assign({
            prompt: 'best quality, masterpiece, highres, 1girl,china dress,Beautiful face',
            negative_prompt: 'NSFW, lowres,bad anatomy,bad hands, text, error, missing fingers,extra digit, fewer digits, cropped, worstquality, low quality, normal quality,jpegartifacts,signature, watermark, username,blurry,bad feet',
            steps: 20,
            size: '0512x0512',
            resize: '1024x1024',
            n_iter: 1,
            cfg_scale: 7,
            seed: -1,
            hr_upscaler: '',
            prompt_extra: '',
            negative_prompt_extra: '',
            sampler: 'DPM++ 2M Karras',
            enable_options: [], // save_images restore_faces enable_hr
         }, getConfig('sd_config', {}))
         
         g_form.confirm1({
            id: 'sd_txt2img',
            title: 'Stable Diffusion 文生图<i class="ti ti-refresh ms-2 fs-2" data-action="sd_refresh"></i>',
            elements: {
                model: {
                    title: '模型',
                    type: 'select',
                    class: 'col-4',
                    list: [],
                    value: '',
                },
                prompts: {
                    title: '提示词模板',
                    type: 'select',
                    class: 'col-4',
                    props: 'data-change="sd_setPromptPreset"',
                    list: [],
                },
                sampler: {
                    title: '采样器',
                    type: 'select',
                    class: 'col-4',
                    list: [],
                    value: data.sampler,
                },
                prompt: {
                    title: '提示词',
                    class: 'col-6',
                    type: 'textarea',
                    rows: 5,
                    props: 'data-input="input_sd_prompt"',
                    value: data.prompt,
                },
                prompt_extra: {
                    title: '固定提示词',
                    class: 'col-6',
                    type: 'textarea',
                    rows: 5,
                    props: 'data-input="input_sd_prompt"',
                    value: data.prompt_extra,
                },
                negative_prompt: {
                    title: '反向提示词',
                    class: 'col-6',
                    type: 'textarea',
                    rows: 5,
                    value: data.negative_prompt,
                },
                negative_prompt_extra: {
                    title: '反向固定提示词',
                    class: 'col-6',
                    type: 'textarea',
                    rows: 5,
                    value: data.negative_prompt_extra,
                },
                steps: {
                    title: '步数',
                    class: 'col-2',
                    props: 'type="number" min="1" max="150"',
                    value: data.steps,
                },
                n_iter: {
                    title: '数量',
                    class: 'col-2',
                    props: 'type="number" min="1" max="100"',
                    value: data.n_iter,
                },
                cfg_scale: {
                    title: 'CFG',
                    class: 'col-2',
                    props: 'type="number" min="1" max="30"',
                    value: data.cfg_scale,
                },
                size: {
                    title: '宽高',
                    class: 'col-3',
                    type: 'inputmask',
                    mask: '0000x0000',
                    value: data.size,
                },
                seed: {
                    title: '种子',
                    class: 'col-3',
                    props: 'type="number"',
                    value: data.seed,
                },
                lora: {
                    title: 'lora',
                    type: 'tom_select',
                    class: 'col-12',
                    list: [],
                    value: '',
                    onInit(){
                        let onSelected = id => {

                        }
                        this.on('item_select', el => onSelected(el.value));
                        this.on('item_remove', id => onSelected(id));
                    },
                    onChange(){
                        let all = Object.keys(this.options)
                        let loras = this.getValue().split(',').sort()
                        const clearLora = input => matchTexts(input.value, '<lora:', '>', true).forEach(lora => {
                            let name = lora.split(':')[1]
                            if(all.includes(name)){ // 不清除不在lora列表中的（lora不能实时刷新）
                                input.value = input.value.replace(lora, '')
                            }
                        })
                        let input = g_form.getInput('sd_txt2img', 'prompt')
                        clearLora(input)
                        let extra = g_form.getInput('sd_txt2img', 'prompt_extra')
                        clearLora(extra)
                        loras.forEach(lora => {
                            if(lora != '') extra.value = `<lora:${lora}:1>` + extra.value
                        })
                    }
                },
                // lora_keywords: {
                //     title: '触发词',
                //     type: 'tom_select',
                //     class: 'col-4',
                //     list: [],
                //     value: '',
                //     opts: {
                //         create: true,
                //         maxItems: 1,
                //     },
                //     onChange(){
                //         let val = this.getValue()
                //         let extra = g_form.getInput('sd_txt2img', 'prompt_extra')
                //         if(!extra.value.includes(val)) extra.value += ',' + val
                //     }
                // },
                // hr_upscaler: {
                //     title: '高清算法',
                //     type: 'select',
                //     class: 'col-4',
                //     list: [],
                //     value: data.hr_upscaler,
                // },
                // resize: {
                //     title: '高清宽高',
                //     class: 'col-4',
                //     type: 'inputmask',
                //     mask: '0000x0000',
                //     value: data.resize,
                // },
                options: {
                    title: '更多选项',
                    type: 'checkbox_list',
                    list: {save_images: 'webui保存图片', restore_faces: '面部修复',  keep_update: '实时更新', /*enable_hr: '高清修复'*/},
                    value: data.enable_options,
                }
            }
        }, {
            onShow: () => _refreshModelsList(false),
            html: `
            <div class="row w-full">
                <div class="d-flex align-items-center hide1 mb-2" id="sd_status">
                    <div class="flex-grow-1 ">
                        <div class="progress w-full col-8" role="progressbar" style="height:20px">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 25%"></div>
                        </div>
                    </div>
                    <div class="ps-3">
                        <button class="btn btn-outline-warning" data-action="sd_pause">暂停</button>
                        <button class="btn btn-outline-danger" data-action="sd_cancel">取消</button>
                    </div>
                </div>
                <div class="modal_form col-5"></div>
                <ul class="col-7 d-flex flex-wrap align-items-start align-content-start overflow-y-auto" style="height: calc(100vh - 150px);padding-bottom: 125px;" id="sd_result">
                    
                </ul>
            </div>
            `,
            bodyClass: 'overflow-y-hidden',
            header: `
            <div class="">
                <i class="ti ti-app-window fs-2 me-2" data-action="sd_win" title="网页端"></i>
                <i class="ti ti-settings fs-2 me-2" data-action="sd_settings" title="设置"></i>
            </div>
            {closeBtn}`,
            buttons: [{
                text: '生成',
                class: 'btn-primary',
                action: 'sd_general',
            }, {
                text: '全选',
                class: 'btn-success',
                onClick: toggleSelectAll
            },{
                text: '导入',
                class: 'btn-warning',
                onClick: btn => {
                    btn.classList.add('btn-loading')
                    let data = []
                    let cnt = 0
                    $('.sd_image').each((i, el) => {
                        if(el.classList.contains('selected')){
                            let {infotexts, prompt, sd_model_hash, job_timestamp} = self.ret.info[i]
                            data.push({
                                file: el.querySelector('img').src,
                                // title: prompt.replaceAll(/<[^>]*>|\([^)]*\)|,/g, "").trim(), // 去除括号内的内容
                                title: job_timestamp,
                                meta: {
                                    // folders: ['AI绘画'],
                                    // tags: [sd_model_hash],
                                    // desc: infotexts[0],
                                }
                            })
                        }
                    })
                    g_data.file_revice(data).then(({added}) => {
                        added = added.length
                        if(added) toast('成功添加'+added+'张图片！', 'success')
                        btn.classList.remove('btn-loading')
                    })
                }
            }],
            width: '95%',
            once: false,
            overwrite: false,
            btn_close: false,
        })
    }

    const saveConfig = newData => {
        setConfig('sd_config', {...getConfig('sd_config', {}), ...newData})
        g_form.assignElements('sd_txt2img', newData) & doAction('sd_txt2img')
    }

    window.g_sd = {post, saveConfig}
})()

