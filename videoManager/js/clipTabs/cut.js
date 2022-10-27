g_clipTabs.register('cut', {
	onTabChanged: tab => {
		console.log('onTabChanged',tab)
	},
	onVideoEvent: (type, tab) => {
		console.log('onVideoEvent', type, tab)
	},
	tab: {
	    id: 'cut',
	    title: '<i class="ti ti-cut fs-2"></i>',
	    html: `
		    <div class="row h-full">
		        <div class="col-3">
		            <img src="res/1.jpg" class="w-full shadow border rounded-3">
		            <input class="form-control mt-1" placeholder="起点">
		        </div>
		        <div class="col-3">
		            <img src="res/1.jpg" class="w-full shadow border rounded-3">
		            <input class="form-control mt-1" placeholder="终点">
		        </div>
		        <div class="col">
		            <textarea class="form-control" placeholder="注释" rows="3"></textarea>
		            <div class="mt-2 w-full text-end">
		                <button class="btn btn-primary">添加</button>
		            </div>
		        </div>
		    </div>
		    
		    `
		},
}, {
	init(){
		g_action.registerAction({
			cut_setStart: dom => {

			}

		})

	}

})
