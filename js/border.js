
g_border.init({
	init(){
		this.bar.html(`
				<div  class="flex-grow-1 ms-2 p-1">
				<div class="traffic_icons d-flex align-items-center m-0" style="top: 2px;">
	            	<div data-action="sidebar_toggle,left" ><i class="ti ti-layout-sidebar"></i></div>
					<b id="title" class="flex-fill border-start border-1 app-region-darg ps-2 cursor-move">${document.title}</b>
				</div>
	        </div>


			<div id="traffic">
				<div class="traffic_icons d-flex align-items-center m-0" style="font-size: 1.2rem;top: 2px;">
					<input tabindex="-1" data-input="range_view" type="range" class="form-range pe-2 me-2 border-end" value="0" min="100" max="500" step="20" style="max-width: 125px;">
	            	<div data-action="sidebar_toggle,right"><i class="ti ti-layout-sidebar-right"></i></div>
	            	<div data-action="pin"><i class="ti ti-pin"></i></div>
	            </div>
	            <div class="light" style="background-color: #55efc4 !important" data-action="min"></div>
	            <div class="light" style="background-color: #ffeaa7 !important" data-action="max"></div>
	            <div class="light" style="background-color: #ff7675 !important" data-action="close"></div>
	        </div>
		`)
	}

})