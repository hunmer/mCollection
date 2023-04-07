g_filter.filter_set('color', new datalist_filter({
    icon: 'palette',
    name: 'color',
    desc: '颜色',
    
    preUpdate({ val, match, sqlite }) {
        // ？还是匹配全部？
        if(sqlite.checkOption('where', [])){
            // 没有其他过滤器，单独设置颜色
            console.log('空的')
            g_detail.inst.color.doSearch(hexToRgb(val))
        }else{
            // 筛选当前列表颜色
        }
        // let table = 'color_meta'
        // sqlite
        //     .assignValue('args', {color: `INNER JOIN ${table} ON files.id = ${table}.fid ` })
        // return {color: `${table}.ids ${match == 'NOT' ? 'NOT' : ''} like '%|${val}|%'`}
    },

    init() {
        // g_datalist.filter.register(_name, data => this.setData(data)) // 过滤器子项目选中事件
        g_input.bind('color_select', ({ val }) => this.setData({ val })) // TODO 事件广播
    },

    color_getElement(color) {
        return $('[data-action="color_select"]' + (color ? '[value="' + color + '"]' : ''))
    },

    show(){
        this.getBody().html(this.html())
    },

    color_select(color) {
        let div = this.color_getElement(color)
        if (div.length) return div.click()
        getEle({ change: 'color_select' }).value = color
    },

    html(){
        let h = ['#206bc4', '#4299e1', '#ae3ec9', '#d6336c', '#d63939', '#f76707', '#f59f00', '#74b816'].map(color => `
            <div class="col-auto">
                <label class="form-colorinput">
                  <input name="color_select" type="radio" value="${color}" class="form-colorinput-input">
                  <span class="form-colorinput-color rounded-circle" style="background-color:${color}"></span>
                </label>
            </div>`).join('')
        return `
            <div class="p-2" style="width: 350px;">
                <div class="row colorpicker">
                  <div class="col-auto">
                    <input type="color" name="color_select" class="form-control form-control-color border-none p-0" style="width: 24px;" value="#206bc4" title="选择颜色">
                  </div>
                  ${h}
                </div>
            </div>`
    },
}))