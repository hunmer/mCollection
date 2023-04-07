module.exports = function(_opts) {
    var _name = _opts.name
    return new datalist_filter(Object.assign({
        preUpdate(data) {
            // TODO 开头或者结尾匹配
            if(!isEmpty(data.val)){
                return this.preUpdate1(data)
            }
        },

        resetInput(){
           this.getBody().find('textarea').val('')
        },

        init() {
            // g_datalist.filter.register(_name, data => this.setData(data))
            g_input.bind({
                [_name + '_filter_val']: ({ val }) => {
                    g_datalist.tab_getData('sqlite').removeOption('where', ([k]) => k.startsWith(this.name)) // 只有一个Input输入所以触发事件也只有这一个
                    this.setData({ val })
                },
            })
        },

        show() {
            this.getBody().html(this.html())
        },

        html() {
            return `
            <div class="p-2">
                <label class="form-label">${this.header}</label>
                <textarea class="form-control mb-3" name="${_name}_filter_val" data-bs-toggle="autosize" placeholder="一行一个关键词"></textarea>

                ${this.getFilterHTML()}
            </div>`
        }
    }, _opts))
}