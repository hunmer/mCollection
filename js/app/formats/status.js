(() => {

    g_plugin.registerEvent('onBeforeShowingDetail', ({ columns }) => {
            columns.status = {
                multi: true,
                classes: 'border-top mh-50',
                list: {
                    files: {
                        check: i => i > 1,
                        title: '文件数量',
                        class: 'bg-indigo-lt',
                        getVal(items){
                            let cnt = items.length
                            if(cnt > 1) return cnt
                        }
                    },
                    size: {
                        title: '大小',
                        class: 'bg-indigo-lt',
                        getVal: items => renderSize(items.reduce((total, item) => total + item.size, 0))
                    },
                    ext: {
                        check: i => i == 1,
                        title: '扩展名',
                        class: 'bg-lime-lt',
                        getVal: ([d]) => popString(d.title, '.')
                    },
                    date: {
                        check: i => i == 1,
                        title: '改动',
                        class: 'bg-red-lt',
                        primary: -10,
                        getVal: ([d]) => getFormatedTime(5, d.date)
                    },
                    bir: {
                        check: i => i == 1,
                        title: '创建',
                        class: 'bg-red-lt',
                        primary: -11,
                        getVal: ([d]) => getFormatedTime(5, d.birthtime)
                    }
                },
                async html(items) {
                    let h = ''
                    let cnt = items.length
                    for (const [k, v] of Object.entries(this.list).sort((a, b) => {
                        let a1 = a[1].primary || 0
                        let b1 = b[1].primary || 0
                        return b1 - a1
                    })) {
                        if(v.check && v.check(cnt) === false) continue
                        let val = await v.getVal(items)
                        if (isEmpty(val) || val === false) continue
                        h += `
                            <div class="d-flex p-1">
                                <span class="badge ${v.class}">${v.title}</span>
                                <div class="flex-fill text-end">${val}</div>
                            </div>
                        `
                    }
                    return `
                    <div class="rows align-items-center mt-2 w-full align-self-end">
                        ${h}
                    </div>`
                }

            }
    }, 99)
})()