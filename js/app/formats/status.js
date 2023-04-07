$(function() {
    g_plugin.registerEvent('onBeforeShowingDetail', ({ items, columns }) => {
        if (items.length == 1) {
            columns.status = {
                multi: true,
                list: {
                    /*
                    files: {
                        title: '文件数量',
                        class: 'bg-indigo-lt',
                        getVal: () => d.files > 1 ? d.files : ''
                    },*/
                    size: {
                        title: '大小',
                        class: 'bg-indigo-lt',
                        getVal: d => renderSize(d.size)
                    },
                    ext: {
                        title: '扩展名',
                        class: 'bg-lime-lt',
                        getVal: d => popString(d.title, '.')
                    },
                    date: {
                        title: '改动',
                        class: 'bg-red-lt',
                        primary: -10,
                        getVal: d => getFormatedTime(5, d.date)
                    },
                    bir: {
                        title: '创建',
                        class: 'bg-red-lt',
                        primary: -11,
                        getVal: d => getFormatedTime(5, d.birthtime)
                    }
                },
                async html(d) {
                    let h = ''
                    for (const [k, v] of Object.entries(this.list).sort((a, b) => {
                        let a1 = a[1].primary || 0
                        let b1 = b[1].primary || 0
                        return b1 - a1
                    })) {
                        let val = await v.getVal(d)
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
        }
    })
})