g_style.addStyle('group_selector', `
    /* 选中效果 */
    .groupList .form-selectgroup-item.active .form-selectgroup-label {
        color: #fff!important;
        background: #206bc4!important;
    }
    /* 隐藏input:focus 边框效果 */
    .groupList .form-selectgroup-input:not(:checked):focus+.form-selectgroup-label {
        border-color: unset;
        box-shadow: none;
        color: #626976;
        border: 1px solid #d9dbde;
    }
`)

var g_groupList = {
    init(){

    },
    instance: {},
    selector: {},
    selector_build(name, opts) {
        this.selector[name] = opts
        this.instance[name] = new groupList(name, opts)
        return this.instance[name]
    },

}

g_groupList.init()

class groupList {
    constructor(name, opts) {
        this.isFirstLoad = true
        this.name = name //  type + '_list'
        this.newst = []
        this.opts = Object.assign({
            onSelectedOption: () => {},
            html: d => {
                return `
              <div class="form-selectgroup mb-3 w-full">
                <div class="input-icon w-full mr-2 mb-1">
                  <input type="text" value="" class="search form-control form-control-rounded" placeholder="搜索(支持首字拼音搜索)">
                  <span class="input-icon-addon">
                    <i class="ti ti-search"></i>
                  </span>
                </div>

                <div class="w-full mb-3">
                  <div class="form-selectgroup">
                    <label class="form-selectgroup-item">
                      <input name="{name}" type="radio" value="sz" class="form-selectgroup-input">
                      <span class="form-selectgroup-label">
                        <i class="ti ti-inbox"></i>
                        所有</span>
                    </label>
                    <label class="form-selectgroup-item">
                      <input name="{name}" type="radio" value="group" class="form-selectgroup-input">
                      <span class="form-selectgroup-label">
                        <i class="ti ti-folder"></i>
                        群组</span>
                    </label>
                  </div>
                </div>
                
                <div class="listContent w-full d-flex flex-wrap overflow-y-auto" style="max-height: 300px;"></div>
                <div class="selectedList mt-2 w-full border-start hide">
                     <div class="form-selectgroup">
                        <label class="form-label w-full">
                            <span class="badge bg-primary badge-sm">0</span>
                            <b>选中的项目</b>
                        </label>
                            <div class="selectedList_content d-flex flex-wrap"></div>
                       </div>
                </div>
            </div>`
            },
        }, opts)

    }

    // 返回div
    element() {
        return $(this.opts.container)
    }

    // 返回元素
    getOption(tag, container = '.listContent') {
        return this.element().find(container + ' .option[value="' + tag + '"]')
    }

    // 返回选中
    getSelected(vals = true) {
        let div = this.element()
        let get = container => Array.from(div.find(container + ' .option:checked').map((i, dom) => dom.value))
        let selected = get('.listContent')

        get('.selectedList').forEach(k => { // 始终合并选中列表（兼容搜索状态下)
            if (selected.indexOf(k) == -1) {
                selected.push(k)
            }
        })
        return selected
    }

    // 返回选择改变
    getChanges() {
        let r = arr_compare( this.opts.selected, this.getSelected())
        r.newst = this.newst // 新增加的项目
        return r
    }

    // 设置分类
    setList(name, update = true) {
        this.category = name
        this.list = this.opts.onSelectedList(name)
        update && this.updateList()
    }

    // 更新所有
    show() {
        let self = this
        if (self.isFirstLoad && !isEmpty(self.opts.defaultList)) self.setList(self.opts.defaultList, false)

        let div = self.element().html(`
            <div class="groupList" data-groupList="${self.name}">
                ${self.opts.html().replaceAll('{name}', self.name)}
            </div>
        `)
        div.find('.search')
        .on('input', () => self.updateList())
        .on('keyup', function(e){
            if(e.keyCode == 13){
                self.addOption(this.value)
                this.value = ''
                self.updateList()
            }
        })
        div.find('input[type="radio"]').on('change', e => self.setList(e.target.value)).filter((i, dom) => dom.value == self.category).parents('.form-selectgroup-item').addClass('active')

        self.updateList()
        self.updateSelected()
        self.isFirstLoad = false
    }

    // 搜索框添加
    addOption(val){
        if(!this.getOption(val).length){
            if(!this.newst.includes(val)) this.newst.push(val)

             // tags_list
            // TODO 重新调整列表
            let option = this.getItemHtml(val, 'checked')
            // this.element().find('.listContent').append(option)
            this.element().find('.selectedList_content').append(option)
            this.updateList()
            this.updateSelected()
        }else{
            // 默认选中第一个结果
        }
    }

    // 更新选择的结果
    updateSelected() {
        let h = ''
        let i = 0
        let self = this
        for (let key of this.getSelected()) {
            h += this.getItemHtml(key, 'checked')
            i++
        }
        let div = this.element().find('.selectedList').toggleClass('hide', i == 0)
        div.find('.badge').html(i)
        div.find('.selectedList_content').html(h).find('.option').on('change', function(e) {
             self.getOption(this.value).prop('checked', false)
            self.updateSelected()
        })
    }

    getItemText(k){
        return this.opts.getName ? this.opts.getName(k) : k
    }

    // 返回结构
    updateList() {
        let h = ''
        let self = this
        let div = this.element()

        let selected
        if(self.isFirstLoad) selected = this.opts.selected // 第一次返回默认选中
        if (!selected || !selected.length) {
            selected = this.getSelected()
        }

        let search = div.find('.search').val()
        for (let [k, items] of Object.entries(Object.assign(this.list, {新添加: this.newst}))) {
            let h1 = ''
            items.forEach(item => {
                 if(PinYinTranslate.check(search, this.getItemText(item))){
                    h1 += this.getItemHtml(item, selected.includes(item) ? 'checked' : '')
                }
            })
            let header = this.opts.getHeader ? this.opts.getHeader(k) : k
            h += h1 ? `
                <div class="mt-1 w-full form-selectgroup">
                    <label class="form-label w-full"><b>${header}</b></label>
                    ${h1}
                </div>
            ` : ''

        }

        this.element().find('.listContent').html(h).find('.option').on('change', function(e) {
            if (self.opts.onSelectedOption(this) !== false) {
                if(!this.checked){ // 同步删除选中
                   self.getOption(this.value, '.selectedList').remove()
                }
                self.updateSelected()
            }
        })
    }

    // 物品结构
    getItemHtml(val, attr) {
        let title = typeof(this.opts.getName) == 'function' ? this.opts.getName(val) : val // 目录传过来是id,这个方便获取名称
        return `
             <label class="form-selectgroup-item" >
              <input type="checkbox" value="${val}" class="option btn-sm form-selectgroup-input" ${attr}>
              <span class="form-selectgroup-label text-nowarp">${title}</span>
            </label>
        `
    }

}