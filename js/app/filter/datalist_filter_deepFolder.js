module.exports = function(_opts) {
    var _inst = _opts.inst
    var _name = _opts.name
    var _table = _name+'_meta'
    return new datalist_filter(Object.assign({
        preUpdate({ val, match, sqlite, equal, reverse }) {
            val = toArr(val)
            if (match != 'NOT') match = ''
            sqlite.assignValue('args', {
                [_name]: `INNER JOIN ${_table} ON files.id = ${_table}.fid `
            })
            if (equal == '=') {
                return {
                    [_name]: `${_table}.ids ${match} ${reverse ? '!' : ''}= '${g_data.arr_join(val)}'`
                }
            }
            return arr_forEach(val, id => [_name + '_' + id, `${_table}.ids ${match} ${reverse ? 'NOT' : ''} ${equal} '%|${id}|%'`])
        },

        init() {
            g_sort.set(_name + '_group', id => '标签列表')
            g_datalist.filter.register(_name, data => this.setData(data)) // 过滤器子项目选中事件
            this.buildSelector()
        },

        show() {
            this.selector.show()
        },

        resetInput(){
            this.selector.clear()
        },

        buildSelector() {
            let id = _name + '_filter'
            this.selector = _inst.buildSelector(id, {
                selected: [],
                sorts: {
                    [id]: { title: '过滤', icon: 'filter' }
                },
                container: `#` + this.dropdown.name,
                async onSelectedList(name) {
                    // TODO 实时更新选中列表
                    if (name == id) {
                        // 获取当前查询的所有目录id
                        let all = await g_data.all(
                            g_datalist.tab_getData('sqlite').clone()
                            .assignValue('args', {
                                [_name]: `INNER JOIN ${_table} ON files.id = ${_table}.fid `
                            })
                            .setOption('search', `${_table}.ids`).toString()
                        )
                        let fids = uniqueArr(flattenArray(all.map(({ ids }) => g_data.arr_split(ids))))
                        return { 当前列表: fids }
                    }
                    return _inst.folder_sort(name)
                },
                onShow: div => div.append(this.getFilterHTML()),
                onSelectedChanged({ selected }) {
                    g_datalist.filter.set(_name, { val: selected, group: this.category })
                }
            })
            return this.selector
        }
    }, _opts))
}