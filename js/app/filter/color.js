g_filter.filter_set('color', {
    title: '',
    icon: 'palette',
    init: d => {
    	g_filter.instance['color'].color_select(d.color.selected)
    },
    html: d => {
    		let h = ''
    	for(let color of ['#206bc4', '#4299e1', '#ae3ec9', '#d6336c', '#d63939', '#f76707', '#f59f00', '#74b816']){
    		h += `<div class="col-auto">
                <label class="form-colorinput">
                  <input name="color-rounded" data-action="color_select" type="radio" value="${color}" class="form-colorinput-input">
                  <span class="form-colorinput-color rounded-circle" style="background-color:${color}"></span>
                </label>
              </div>`
    	}
        return `
			  <div class="p-2" style="width: 350px;">
			  	<div class="row colorpicker">
			  	  <div class="col-auto">
                    <input type="color" data-change="color_select" class="form-control form-control-color border-none p-0" style="width: 24px;" value="#206bc4" title="选择颜色">
                  </div>
                  ${h}
                </div>
			</div>`
    }
}, {
    init() {
        const self = this
        g_action.
        registerAction('color_select', dom => {
        	g_filter.setOpts('filter.color.selected', dom.value)
        	if(dom.dataset.change){
        		getEle('color_select', ':checked').prop('checked', false)
        	}
        })
    },
    color_getElement(color){
    	return $('[data-action="color_select"]'+(color ? '[value="'+color+'"]' : ''))
    },
    color_select(color){
    	let div = this.color_getElement(color)
    	if(div.length) return div.click()
    	getEle({change: 'color_select'}).value = color
    }
})