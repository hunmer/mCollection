// ==UserScript==
// @name    高级队列
// @version    1.0
// @author    hunmer
// @icon    list
// @description    支持对队列进行一系列操作与查看
// @updateURL    https://neysummer2000.fun/mCollection/scripts/高级队列.js
// @namespace    b2cdcea5-1fba-4f35-a331-2bdabc4406ec

// ==/UserScript==

({
    init(){
        $(`<div data-action="queue_list"><i class="ti ti-list-check"></i></div>`).insertBefore(getEle('sidebar_toggle,right'));
        g_action.registerAction({
            queue_list: () => this.queue_list(),
            queue_onInputChanged: (dom, action) => {
                let val = ['switch', 'checkbox', 'radio'].includes(dom.type) ? dom.checked : dom.value
                g_queue.method(getParentData(dom, 'key'), action[1], val)
            }
        })
        // this.queue_list()
    },

    queue_list(){
        let timer
        const activeAction = 'activeClass,queueList,table-primary'
        g_form.confirm1({
            id: 'modal_queueList',
            title: '队列列表',
            elements: {
                table: {
                    type: 'html',
                    props: `style="max-height: 400px;overflow-y: auto;"`,
                    value: () => {
                        let items = {}
                        Object.entries(g_queue.list).map(([name, inst], i) => {
                            let status = inst.getListStatus()
                            let running = status[TASK_RUNNING].length
                            let waitting = status[TASK_WAITTING].length
                            let completed = status[TASK_COMPLETED].length
                            let error = status[TASK_ERROR].length
                            items[name] = {
                                props: `data-action="${activeAction}"`,
                                row: [i+1, inst.opts.title || inst.name, running+waitting+completed+error, completed, running, waitting, error, `
                                <input type="number" min="1" max="150" data-change="queue_onInputChanged,setMax" class="form-control form-control-flush" value=${inst.opts.max} placeholder="请输入...">
                                `, `
                                <label class="form-check form-switch">
                                    <input data-change="queue_onInputChanged,setRunning" class="form-check-input" type="checkbox" ${inst.isRunning() ? 'checked': ''}>
                                </label>`],
                            }
                        }) 
                        return g_tabler.build_table({
                            items,
                            headerClass: 'sticky-top',
                            headers: [{title: 'ID'}, {title: '队列名'}, {title: '累计任务'}, {title: '已完成'},{title: '运行中'}, {title: '等待中'},  {title: '失败'}, {title: '并发数'}, {title: '运行状态'}],
                        })
                    }
                },
                tasks: {
                    type: 'html',
                    value: () => {
                        let selected = this.selected
                        if(isEmpty(selected)) return ' '

                        let inst = g_queue.getInst(selected)
                        let html = [
                            ['primary', '运行中', '<ul>'+inst.getListStatus()[TASK_RUNNING].map(id => `<li>${id}</li>`).join('') + '</ul>', `
                            <i class="ti ti-trash text-danger fs-2" onclick="g_queue.clearStatus('${selected}', ${TASK_RUNNING})"></i>`],
                            ['warning', '任务信息', '', '']
                        ].map(([color, title, body, actions], i) => {
                            return `
                            <div class="col-6">
                                <div class="card">
                                    <div class="card-status-top bg-${color}"></div>
                                    <div class="card-header">
                                        <h3 class="card-title">${title}</h3>
                                        <div class="card-actions">
                                            ${actions}
                                        </div>
                                    </div>
                                    <div class="card-body p-1 overflow-y-auto" style="max-height: 300px;">
                                        ${body}
                                    </div>
                                </div>
                            </div>
                            `
                        }).join('')
                        
                        return `
                        <div class="d-flex flex-nowrap">
                            <div><h4>${inst.opts.title}</h4></div>
                            <div class="ms-auto">
                                <i class="ti ti-trash text-danger fs-2" onclick="g_queue.clear('${selected}')"></i>
                            </div>
                        </div>
                        <div class="row row-cards">${html}</div>`
                    },
                },
            },
        }, {
            buttons: [{
                text: '清空',
                class: 'btn-danger',
                onClick: () => {
                    
                }
            }],
            once: true,
            width: '80%',
            scrollable: true,
            onShow: () => {
                let cnt = 0
                timer = setInterval(() => {
                    if(isInputFocus()) return
                    
                    let id = this.selected = getEle(activeAction, '.table-primary').data('key')
                    g_form.update('modal_queueList', 'table')
                    if(++cnt % 4 == 0) g_form.update('modal_queueList', 'tasks')
                    getEle(activeAction, '[data-key="'+id+'"]').addClass('table-primary')
                }, 500)
            },
            onHide: () => clearInterval(timer)
        })
    },




}).init()

