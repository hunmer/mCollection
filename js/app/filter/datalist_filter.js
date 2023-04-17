g_datalist.filter = {
    list: {},
    data: {},
    register(name, callback) {
        this.list[name] = {
            callback,
            data: {},
        }
    },

    set(name, data, id) {
        id ??= g_datalist.getCurrentTab()
        let inst = this.get(name)
        if (inst) {
            inst.data[id] = data
            inst.callback(data)
        }
    },

    get(name) {
        return this.list[name]
    },
}

// TODO filter复数支持，对应tab或者其他(type: tab...)
class datalist_filter {
    data = {}
    title = ''
    constructor(funs) {
        Object.assign(this, funs)
        this.registerActions()
    }

    // 设置过滤数据
    setData(data) {
        Object.assign(this.data, data)
        this.update()
    }

    resetInput(){

    }

    // 清空过滤数据
    clearData() {
        this.data.val = []
        
        // TODO 判断是否有开启高级过滤器再选择是否关闭
        this.getInput('match').val('AND')
        this.getInput('equal').val('like')
        this.getInput('reverse').prop('checked', false)
        this.resetInput()
        this.update()
    }

    // 更新过滤结果
    update() {
        // TODO 判断目标table是否为files
        let name = this.name
        let data = Object.assign({
            match: 'AND',
            equal: 'like',
            include: '',
        }, this.data)
        let cnt = isEmpty(data.val) ? 0 : toArr(data.val).length
        this.getBadge().toggleClass('hide1', cnt == 0).html(cnt)

        let sqlite = data.sqlite = g_datalist.tab_getData('sqlite')
        let where = this.preUpdate(data)
        if (cnt == 0) { // 没有选中,清空过滤器
            // TODO 如何保存tab修改前的sqlite呢?data里的类似sqlite的filters属性?清空过滤器则复原
            let cb = ([k]) => k.startsWith(name)
            sqlite
                .removeOption('args', cb)
                .removeOption('where_do', cb)
                .removeOption('where', cb)
        } else {
            sqlite.assignValue('where_do', {
                [this.name]: data.match
            }) // 总是更新唯一的where_do
        }
        where && sqlite.assignValue('where', where) // where_do 可以导入函数，判断where的键值是否匹配
        g_datalist.tab_clear(undefined, true)
    }

    // 注册事件
    registerActions() {
        let id = this.name + '_filter_'
        g_input.bind({
            [id + 'match']: ({ val }) => this.setData({ match: val }),
            [id + 'include']: ({ val }) => {
                // 如果选择不包含，则删除所有where且禁用输入框
                // TODO
                this.setData({ include: val })
            },
            [id + 'equal']: ({ val }) => {
                // 每次切换模糊匹配或者完成匹配都要清空where
                g_datalist.tab_getData('sqlite').removeOption('where', ([k]) => k.startsWith(this.name))
                this.setData({ equal: val })
            },
            [id + 'reverse']: ({ selected }) => this.setData({ reverse: selected }),
        }) // TODO 事件广播
        g_action.registerAction(id + 'reset', () => this.clearData())
    }

    // 获取输入框
    getInput(name){
        return $(`[name="${this.name}_filter_${name}"]`)
    }

    // 获取结构html
    getFilterHTML() {
        let id = this.name + '_filter_'
        const build = g_tabler.build_select
        return `
            <div class="input-group w-full">
                <span class="input-group-text">
                  <input class="form-check-input m-0" name="${id+'reverse'}" type="checkbox" />
                  <span class="form-check-label ms-2">反选</span>
                </span>
                
                ${build({
                    list: { OR: '或', AND: '和'},
                    value: 'AND',
                    name: id+'match'
                })}
                 ${build({
                    list: { like: '模糊匹配', '=': '完全匹配'},
                    value: 'like',
                    name: id+'equal'
                })}
               
                <button class="btn" type="button" data-action="${id+'reset'}">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `

          // ${build({
          //           list: { '': '非空', '!': '空值'},
          //           value: '',
          //           name: id+'include'
          //       })}
    }

    // 获取主体
    getBody() {
        return this.dropdown.getElement().find('.dropdown_content')
    }

    onShow() {
        if (!this.inited) {
            this.inited = true
            this.show()
        }
    }

    onHide() {
        // let selected = this.selector.getSelected()
        // g_filter.setOpts('filter.folders.selected', selected)
    }

    getButton() {
        return g_filter.filter_getEle(this.name)
    }

    getBadge() {
        return this.getButton().find('.badge')
    }

}