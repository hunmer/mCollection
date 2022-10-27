var g_border = {
	init(){

		this.style = $(`<style>
			:root {
			    --offset-top: 30px !important;
			    --offset-left: 0px;
			}

			#dragBar {
				position:fixed;
				top: 0;
				height: 30px;
				left:var(--offset-left);
				width: calc(100vw - var(--offset-left) - 10px);
				z-index: 2;
			}

			#traffic {
			    display: inline-flex;
			}

			#traffic .light {
			    margin: 8px;
			    width: 15px;
			    height: 15px;
			    border-radius: 50%;
			    cursor: pointer;
			}

			.traffic_icons div:not(:last-child) {
				margin-right: 5px;
			}
			#dragBar i{
				font-size: 1.2rem;
			}

		</style>`).appendTo('body')

		this.bar = $(`<div id="dragBar" class="d-flex m-1">
			<div  class="flex-grow-1 ms-2 p-1">
				<div class="traffic_icons d-flex align-items-center m-0" style="top: 2px;">
	            	<div data-action="sidebar_toggle,left" ><i class="ti ti-layout-sidebar"></i></div>

	            	<div data-action="tab_back" class="tab_nav"><i class="ti ti-arrow-left"></i></div>
	            	<div data-action="tab_forward" class="tab_nav"><i class="ti ti-arrow-right"></i></div>
	            	<div data-action="tab_refresh" class="tab_nav"><i class="ti ti-refresh"></i></div>
					<b id="title" class="flex-fill border-start border-1 app-region-darg ps-2 cursor-move">${document.title}</b>
				</div>
	        </div>


			<div id="traffic">
				<div class="traffic_icons d-flex align-items-center m-0" style="font-size: 1.2rem;top: 2px;">
					<input data-input="range_view" type="range" class="form-range pe-2 me-2 border-end" value="0" min="100" max="500" step="20" style="max-width: 125px;">
					<div class="input-group-sm me-2">
                      <input type="text" value="" class="form-control form-control-rounded" placeholder="搜索">
                    </div>
	            	<div data-action="sidebar_toggle,right"><i class="ti ti-layout-sidebar-right"></i></div>
	            	<div data-action="darkMode" ><i class="ti ti-moon"></i></div>
	            	<div data-action="pin"><i class="ti ti-pin"></i></div>
	            </div>
	            <div class="light" style="background-color: #55efc4" data-action="min"></div>
	            <div class="light" style="background-color: #ffeaa7" data-action="max"></div>
	            <div class="light" style="background-color: #ff7675" data-action="close"></div>
	        </div>
		</div>`).appendTo('main')
					
		
		setInterval(() => {
			let title = document.title
			if(title != self.title){
				self.title = title
				$('#_title').find('b').html(title)
			}
		}, 500)

		g_action.
		registerAction(['pin', 'max', 'min', 'close'], (dom, action) =>  ipc_send(action[0]))
	},

	destroy(){
		this.style.remove()
		this.bar.remove()
	}
}

g_border.init()