// ==UserScript==
// @name    标签页分栏显示
// @version    0.0.1
// @author    hunmer
// @description    支持多个标签页同时显示
// @updateURL   https://neysummer2000.fun/mCollection/scripts/标签页分栏显示.js
// @updateURL    
// @primary    1
// @namespace    459ad131-a27b-4f7e-9a34-57da855e0ce2

// ==/UserScript==

/*

TODO: 修复shift跨越选区的bug

*/   

(() => {

    const prefix = '#itemlist_tabs'
    const getMaxSplit = () => parseInt(getConfig('split_view_max', 1))
    const setMaxSplit = i => {
        setConfig('split_view_max', parseInt(i))
        setGrid()
    }

    g_style.addStyle('', `
        ${prefix} ._tabs-tablist {
            justify-content: center;
        }

        ${prefix} [data-tab][data-grid] { /* 隐藏tab */
            display: none !important;
        }

        ${prefix} [data-tab-content]:not([data-grid]) { /* 隐藏内容 */
            display: none !important;
        }

        ${prefix} .active[data-tab-content] .float-tab {
            background-color: var(--tblr-danger) !important;
        }
    `)

    var lastAcitved
    $(document).on('click', '[data-grid]', function(e){
        let tab = this.dataset.tabContent
        if(!isEmpty(tab)){
            lastAcitved = tab
            g_datalist.tabs.setActive(tab) // 点击内容设置为当前激活
        }
    })
    
    g_dropdown.list.datalist_opts.list['split_view'] = {
        title: '分屏标签',
        icon: 'layout-board-split',
    }

    g_dropdown.register('split_view', {
        position: 'end-top',
        offsetLeft: 10,
        alwaysHide: true,
        parent: ['datalist_opts', 'split_view'],
        list: {
            1: {
                title: '一个',
                action: 'split_view,1',
            },
            2: {
                title: '两个',
                action: 'split_view,2',
            },
            3: {
                title: '三个',
                action: 'split_view,3',
            },
            4: {
                title: '四个',
                action: 'split_view,4',
            },
        }
    }).init()

    g_action.registerAction({
        split_view: (dom, action) => setMaxSplit(action[1])
    })

    const listActives = () => {
        let list = {} // 上次排序列表
        g_datalist.tabs.data.entries((i, item) => {
            let time = item.lastAcitve
            if(!isEmpty(time)) list[item.id] = time
        })
        return Object.entries(list).sort((a, b) => b[1] - a[1])
    }

    // 标签展示事件
    var inited
    g_plugin.registerEvent('tab.event_show', ({name, ev, tab}) => {
        if(name == 'tablist'){ // 忽略系统点击
            clearEventBubble(ev) // 拦截
            if(lastAcitved && lastAcitved == tab) return // 忽略上面的触发
            let tabs = g_datalist.tabs
            lastAcitved ??= tabs.getActive()

            g_pp.setTimeout('setGrid', () => { // 避免多次触发
                let actives = listActives()
                let index = actives.findIndex(([tid]) => tid == lastAcitved) // 所在位置

                let old = tabs.getData(lastAcitved)
                if(old) old.lastAcitve = 0 // 排序最后
                tabs.getData(tab).lastAcitve = actives?.[index]?.[1] || new Date().getTime() 
                setGrid()

                tabs.setActive(tab)
                lastAcitved = tab
            }, 100)
        }
    })

    function setGrid(max){
        inited = true
        max ??= getMaxSplit()

        let tabs = g_datalist.tabs
        let container = tabs.getContainer()
        container.find('._tabs-tabcontent').addClass('row')

        container.find('[data-grid]').attr('data-grid', null)
        container.find('.float-tab').remove()
        
        $('[data-tab-content]').replaceClass('active position-relative show col- order-', '')
        listActives().splice(0, max).forEach(([tab, time], i) => {
            let item = tabs.getData(tab)
            // console.log(i, tab, time, item.title)
            item.props ??= {}
            Object.assign(item.props, {grid: i})

            // order最小为1不能超过5，越大顺位越低: https://v5.bootcss.com/docs/layout/columns/#order-classes
            let btn = tabs.getButton(tab).attr('data-grid', i)
            let content = tabs.getContent(tab).addClass(`position-relative show col-${12/max} order-${i+1}`).attr('data-grid', i)

            $(`<button class="btn btn-primary position-absolute float-tab" style="right: 20px; bottom: 220px;">
                <i class="ti ti-x me-2"></i> ${item.title}
            </button>`).appendTo(content)

            tabs.opts.event_shown({tab, inst: tabs}) // 触发首次加载
        })
    }
    

})()

