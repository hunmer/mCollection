   g_filter.filter_set('folder', {
       title: '',
       icon: 'folder',
       init: d => {
           g_filter.instance['folder'].update_folder_filter()
           g_filter.instance['folder'].folder_selected(d.folder.selected)
       },
       html: d => {
           return `
			  <div class="p-2" style="width: 300px;">
			  	<div class="input-icon input-group-sm w-full mr-2 mb-1">
	              <input data-input="input_folder_search" type="text" value="" class="form-control form-control-rounded" placeholder="搜索(支持首字拼音搜索)">
	              <span class="input-icon-addon">
	              	<i class="ti ti-search"></i>
	              </span>
	            </div>

	            <div id="filter_folder_result" class="w-full overflow-y-auto" style="max-height: 300px;"></div>
				<div id="filter_folder_selected" class="mt-2 w-full border-start hide">
					
				</div>
			</div>`
       }
   }, {
       init() {
           const self = this
           // todo 父文件夹排序器
           // g_sort.set('folder', tag => g_tags.tag_getFolder(tag) || '未分组')
           g_action.
           registerAction('input_folder_search', dom => {
               self.update_folder_filter()
           }).
           registerAction('folder_selected', dom => {
               self.folder_selected()
           }).
           registerAction('folder_unselected', dom => {
               self.folder_getBtn(dom.value).click()
           })
       },

       // 设置当前选中
       folder_selected(selected) {
           if (!selected) selected = this.folder_getSelected()
           let h = ''
           for (let folder of selected) {
               h += this.folder_getHTML(folder, 'checked')
           }
           g_filter.setOpts('filter.folder.selected', selected)
           $('#filter_folder_selected').toggleClass('hide', !h).html(`
    		  <div class="form-selectgroup">
 				<label class="form-label m-0 pe-2 w-full">
 					<span class="badge bg-primary badge-sm">${selected.length}</span>
 					<b>选中的文件夹</b>
 					<label class="form-check float-end">
	                    <input class="form-check-input" type="checkbox" checked>
	                    <span class="form-check-label">全部匹配</span>
	                  </label>
 				</label>
 					${h}
 			   </div>
        	`).find('.folder_btn').attr('data-change', 'folder_unselected')
       },

       // 更新选择器
       update_folder_filter(action = 'folder_selected') {
           let h = this.folder_selector()
           $('#filter_folder_result').html(h).find('.folder_btn').attr('data-change', action) // 绑定选中后的回调
       },

       // 返回所有文件夹
       folder_all() {
           return ['folder1', 'folder2', 'folder3']
       },

       // 返回指定文件夹控件
       folder_getBtn(folder) {
           return $('#filter_folder_result .folder_btn[value="' + folder + '"]')
       },

       // 返回选中的文件夹
       folder_getSelected(vals = true) {
           let doms = $('#filter_folder_result .folder_btn:checked')
           if (vals) {
               let r = []
               for (let dom of doms) r.push(dom.value)
               return r
           }
           return doms
       },

       // 标签分组
       tag_sort(type = 'sz', tags) {
           if (!type) type = g_filter.getOpts('filter.folder.type')
           if (!tags) tags = this.folder_all()
           return g_sort.sort(type, tags)
       },

       // 返回文件夹结构列表
       folder_selector(list, selected, search) {
           let h = ''
           if (list == undefined) list = this.tag_sort()
           if (selected == undefined) selected = g_filter.getOpts('filter.folder.selected', [])
           if (search == undefined) search = getEle({ input: 'input_folder_search' }).val()
           for (let [k, folders] of Object.entries(list)) {
               let h1 = ''
               for (let folder of folders) {
                   if (folder.indexOf(search) != -1) {
                       h1 += this.folder_getHTML(folder, selected.includes(folder) ? 'checked' : '')
                   }

               }
               h += h1 ? `
              	<div class="mb-3">
              	  <label class="form-label w-full"><b>${k}</b></label>
				  <div class="form-selectgroup form-selectgroup-boxes d-flex flex-column">
				   	${h1}
				  </div>
            ` : ''

           }
           return h
       },

       // 返回文件夹控件结构
       folder_getHTML(folder, attr) {
           // 单选
           // radio name
           return `
			<label class="form-selectgroup-item flex-fill">
		      <input type="checkbox" value="${folder}" class="folder_btn form-selectgroup-input" ${attr}>
		      <div class="form-selectgroup-label d-flex align-items-center p-0">
		        <div class="ms-1 me-2 pb-1">
		          <span class="form-selectgroup-check"></span>
		        </div>
		        <div>
		        	${folder}
		        </div>
		      </div>
		    </label>
		`
       },
   })