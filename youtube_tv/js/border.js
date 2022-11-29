
g_border.init({
	init(){
		this.bar.html(`
			<div class="flex-grow-1 ms-2 p-1 app-region-darg ">
				<b id="title" class="flex-fillps-2">${document.title}</b>
	        </div>

			<div id="traffic">
				<div class="traffic_icons d-flex align-items-center m-0" style="font-size: 1.2rem;top: 2px;">
	            	<div data-action="settings,general"><i class="ti ti ti-settings"></i></div>
	            	<div data-action="webview_show"><i class="ti ti-brand-youtube"></i></div>
	            	<div data-action="darkMode" ><i class="ti ti-moon"></i></div>
	            	<div data-action="pin"><i class="ti ti-pin"></i></div>
	            </div>
	            <div class="light" style="background-color: #55efc4" data-action="min"></div>
	            <div class="light" style="background-color: #ffeaa7" data-action="max"></div>
	            <div class="light" style="background-color: #ff7675" data-action="close"></div>
	        </div>
		`)
	}

})