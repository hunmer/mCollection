// ==UserScript==
// @name    SD咒语解析
// @version    0.0.1
// @author    hunmer
// @icon      pentagram:yellow
// @description    支持解析由SD生成图片的咒语信息，支持过滤与查询
// @updateURL    https://neysummer2000.fun/mCollection/scripts/SD咒语解析.js
// @primary    1
// @namespace    734b87cd-b724-459e-8f10-33c724a4d035

// ==/UserScript==

({
    getData: async d => g_data.getMetaInfo(d, 'sd_prompt'),
    setData: (fid, data) => {
        if(data){
            data.fid = fid
            return g_data.data_set2({ table: 'sd_prompt_meta', key: 'fid', value: fid, data})
        }
    },
    removeData: (fid) => g_data.data_remove2({table: 'sd_prompt_meta', key: 'fid', value: fid}),

    taggerImage: (item, vals, callback) => {
        let image = toDataURL('image/png', g_item.item_get(item.md5).find('.thumb')[0], 100) //nodejs.files.getImageBase64(item.file),
        g_sd.post({
            url: 'tagger/v1/interrogate',
            data: {image, ...vals}
        }).then(data => {
            let tags = []
            Object.entries(data.caption).sort((a, b) => b[1] - a[1])
            .forEach(([tag, val]) => {
                if(val >= vals.sameless && tags.length < vals.tagmax) tags.push(tag)
            })
            g_tags.setItemFolder(item.id, g_tags.folder_toIds(tags))
            callback && callback(tags)
        })
    },
    init(){

        g_dropdown.register('sd_prompt_menu', {
            position: 'end-top',
            offsetLeft: 5,
            list: {
                copy: {
                    title: '复制咒语',
                    action: 'sd_promot,copy',
                },
                apply: {
                    title: '应用咒语',
                    action: 'sd_promot,apply',
                },
                tag: {
                    title: '应用标签',
                    action: 'sd_promot,tag',
                },
                drive: {
                    type: 'divider'
                },
                delete: {
                    title: '清除咒语',
                    icon: 'trash',
                    class: 'text-danger',
                    action: 'sd_promot,delete',
                },
            },
        })

        g_action.registerAction('sd_promot', async (dom, action) => {
            g_dropdown.hide('sd_prompt_menu')
            let item = await g_detail.getSelectedItems()[0]
            if(action[1] == 'tag'){
                var prompt = g_detail.last_columns.tags.data.titles.join(',')
                if(isEmpty(prompt)) return toast('没有标签!', 'danger')
                return g_sd.saveConfig({prompt})
            }
            let data = g_detail.last_columns?.sd_detail?.data || await g_detail.inst.sd_prompt.get(item)
            if(!data) return toast('没有找到咒语信息', 'danger')
           
            switch(action[1]){
                case 'copy':
                    return ipc_send('copy', Object.entries(data).map(([k, v]) => k == 'fid' ? '-------' : k + ': ' + v).join("\n"))

                case 'apply':
                    var {prompt, sampler, negative, steps, cfg_scale} = data
                   return g_sd.saveConfig({
                        prompt, sampler, steps, cfg_scale,
                        negative_prompt: negative,
                    })
                    
                case 'delete':
                    return g_detail.inst.sd_prompt.remove(item.id) & g_detail.update()
            }
        })

        g_setting.setDefault('sd_tagger', {
            model: 'wd14-vit-v2',
            threshold: 0.35,
            sameless: 0.35,
            tagmax: 30,
        })
        g_menu.list.datalist_item.items.push(...[
            {text: '读取标签', icon: 'tag', action: 'sd_tagger'},
            {text: '咒语功能', icon: 'pentagram', action: 'sd_prompt_menu'},
        ])

        g_data.table_indexs.sd_prompt_meta = ['fid', 'prompt', 'negative', 'ensd', 'model_hash', 'sampler', 'cfg_scale', 'clip_skip', 'steps']
        g_plugin.registerEvent('db_connected', ({db}) => {
            db.exec(`
            CREATE TABLE IF NOT EXISTS sd_prompt_meta(
                fid      INTEGER PRIMARY KEY,
                prompt   TEXT,
                negative TEXT,
                ensd     INT,
                model_hash  VARCHAR(10),
                sampler    VARCHAR(256),
                cfg_scale  TINYINT,
                clip_skip  TINYINT,
                steps  TINYINT
            );`)
        })
        g_detail.inst.sd_prompt = { set: this.setData, get: this.getData, remove: this.removeData }

        g_plugin.registerEvent('onBeforeShowingDetail', async args => {
            let { items, columns, type, sort, meta } = args
            let len = items.length
            if(len !== 1 || /*type !== 'sqlite' ||*/ getFileType(items[0].title) !== 'image') return
            meta ??= await this.getData(items[0]) // 支持外部导入数据
            if(!meta) return

            sort.splice(sort.indexOf('status'), 0, 'sd_detail') // 插在staus前
            args.sort = sort
            columns.sd_detail = {
                multi: false,
                classes: 'border-top',
                data: meta,
                html() {
                    let h = ''
                    let names = {prompt: '提示词', negative: '反向词', ensd: 'ensd', model_hash: 'model', sampler: 'sampler', cfg_scale: 'cfg', clip_skip: 'clip', steps: 'step'}
                    Object.entries(meta).forEach(([k, v], i) => {
                        let name = names[k]
                        if(name == undefined || v == undefined) return
                        if(['prompt','negative'].includes(k)){
                            let tags = v.split(',')
                            h += `
                            <div class="d-flex w-full mt-1">
                                <div>
                                    <span class="badge bg-${g_tabler.color_random(i)}">${name} ${tags.length}</span>
                                </div>
                                <div class="ms-auto me-2">
                                    <i class="ti ti-copy fs-2" title="复制" data-action="sd_prompt_copy,${k}"></i>
                                </div>
                            </div>
                            
                            <div id="sd_prompt_${k}" class="overflow-y-auto border-primary" style="max-height: 150px" data-value="${v}">
                                ${tags.map((tag, i1) => {
                                    // TODO 权重与特殊标签（画质）突出颜色显示
                                    return `<span data-action="badge_toggleSelected" class="badge m-1 badge-outline text-${g_tabler.color_random(i1)}">${tag.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</span>`
                                }).join('')}
                            </div>`
                        }else{
                            h = `<span data-action="sd_badge_click" class="badge m-1 bg-${g_tabler.color_random(i)}" data-key="${k}" data-value="${v}">${name}:${v}</span>` + h
                        }
                    })
                    return `
                        <div class="d-flex">
                            <div p-2>
                                <a data-action="detail_sdprompt_toggle">
                                    <i class="ti ti-pentagram me-2"></i>咒语信息
                                </a>
                            </div>

                            <div class="ms-auto" >
                                <a href='#' data-target-dropdown="sd_prompt_menu" ><i class="ti ti-dots me-2"></i></a>
                            </div>
                        </div>

                        <div class="collapse ${getConfig('detail_sdprompt_show', true) ? 'show' : ''}" id="sd_detail">
                            <div class="d-flex flex-wrap justify-content-center">${h}</div>
                        </div>
                    `
                },
            }
        })

        let queue = []
        g_plugin.registerEvent('getExifData', ({data, json}) => {
            if(!json.Parameters) return
            let [prompt, negative, detail] = json.Parameters.split("\n")
            if(!detail){
                detail = negative
                negative = ''
            }else{
                negative = negative.replace('Negative prompt: ', '')
            }

            let meta = {prompt, negative}
            detail.split(',').forEach(item => {
                let [k, v] = item.split(':')
                meta[k.trim().replaceAll(' ', '_').toLowerCase()] = v.trim()
            })
            this.setData(data.id, meta)
            queue.push(data)
        })

        // 等待封面生成完成后...
        g_plugin.registerEvent('image.saveCover', ({ md5, img }) => {
            let find = queue.find(item => item.md5 == md5)
            if(find){
                setTimeout(() => this.taggerImage(find, getConfig('sd_tagger')), 2000)
            }
        })

        g_action.registerAction({
             sd_prompt_menu: () => g_menu.hideMenu('datalist_item') & g_dropdown.quickShow('sd_prompt_menu'),
             sd_tagger: async () => {
                let items = (await g_detail.getSelectedItems()).filter(({title}) => getFileType(title) == 'image')
                g_menu.hideMenu('datalist_item')

                let len = items.length
                if(!len) return toast('没有选中图像文件！', 'danger')
                g_sd.post('tagger/v1/interrogators').then(data => {
                    let d = getConfig('sd_tagger')
                    g_form.confirm1({
                        id: 'sd_tagger',
                        title: '标签分析',
                        elements: {
                            model: {
                                title: '模型',
                                type: 'select',
                                list: data.models,
                                value: d.model,
                            },
                            threshold: {
                                title: '强度',
                                props: 'type=number min=0.1 max=1 step=0.1',
                                value: d.threshold,
                            },
                            sameless: {
                                title: '最少相似度',
                                props: 'type=number min=0.1 max=1 step=0.1',
                                value: d.sameless,
                            },
                            tagmax: {
                                title: '最多标签数',
                                props: 'type=number min=1 max=100',
                                value: d.tagmax,
                            },
                            // TODO 黑名单，中文翻译
                        },
                        callback: ({vals}) => {
                            setConfig('sd_tagger', vals)
                            
                            toast('开始分析中...')
                            let next = () => {
                                let item = items.shift()
                                if(!item) return toast('分析完成！', 'success') & g_detail.update()
                               this.taggerImage(item, vals, () => next())
                            }
                            next()
                        }
                    })
                })
            },
            detail_sdprompt_toggle: () => {
                let div = $('#sd_detail')
                let showing = div.hasClass('show')
                div.collapse('toggle')
                setConfig('detail_sdprompt_show', !showing)
            },
            sd_prompt_copy: (dom, action) => {
                let selected = []
                let div = $('#sd_prompt_'+action[1])
                for(let badge of div.find('.badge')){
                    if(badge.classList.value.includes('bg-')){
                        selected.push(badge.value ?? badge.outerText)
                        doAction('badge_toggleSelected', badge)
                    }
                }
                ipc_send('copy', selected.length ? selected.join(',') : div.data('value'))
            },
            sd_badge_click: dom => {
                let {key, value} = dom.dataset
                switch(key){
                    case 'model_hash':
                        return ipc_send('url', 'https://civitai.com/?query='+value)
                }
            }
        })
    
    },

}).init()

