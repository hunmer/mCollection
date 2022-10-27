var g_sideR = {

    init() {
        g_sidebar.register('right', {
            html: `
                <div id="detail_tabs" class="h-full"></div>
            `,
            style: `
                :root {
                    --offset-right: 400px;
                }
                #sidebar_right {
                    right: 0;
                    width: var(--offset-right);
                    top: var(--offset-top);
                    margin-right: 0px;
                }

                #sidebar_right.hideSidebar {
                    margin-right: -var(--offset-right);
                }

                main[sidebar-right]{
                    padding-right: var(--offset-right);
                }
            `,
        })
        $('#sidebar_right').addClass('border-start shadow bg-white')
        setTimeout(() => g_sidebar.show('right'), 250)

        this.tabs = g_tabs.register('detail_tabs', {
            target: '#detail_tabs',
            saveData: false,
            parseContent: (k, v) => {
                return `
                    <div class="datalist">
                        <div class="row row-cards datalist-items"></div>
                   </div>
                `
            },
            // parseTab: (k, v) => v.title,
            onShow: tab => {

            },
            onHide: tab => {

            },
            onClose: tab => {

            },
            items: {
                clips: {
                    id: 'clips',
                    title: '片段',
                    html: `
                    <div class="d-flex flex-row-reverse mb-2">
                		<button class="btn"><i class="ti ti-layout-2"></i></button>
                	</div>
                    <div class="row h-full">
                    	<div class="col-6 position-relative">
	                    	<div class="card">
			                  <div class="card-img-top img-responsive" style="background-image: url(res/1.jpg)"></div>
			                  <div class="progress progress-sm card-progress">
			                    <div class="progress-bar" style="width: 38%" role="progressbar" aria-valuenow="38" aria-valuemin="0" aria-valuemax="100" aria-label="38% Complete">
			                      <span class="visually-hidden">38% Complete</span>
			                    </div>
			                  </div>
			                  <div class="card-body">
			                    <h3 class="card-title">tag1,tag2</h3>
			                    <p class="text-muted">some desc</p>
			                  </div>

			                </div>
                    		<span class="badge bg-primary position-absolute start-10 top-0" title="30S">01:32 - 02:34</span>
                    	</div>
                    </div>
                    `,
                },
                information: {
                    id: 'information',
                    title: '信息',
                    html: `
                    <div class=" h-full">
                      <div class="mb-3">
	                      <label class="form-label">文件名</label>
	                      <div class="form-control-plaintext">Input value</div>
	                    </div>
	                     <div class="mb-3">
	                      <label class="form-label">大小</label>
	                      <div class="form-control-plaintext">40MB</div>
	                    </div>
                    </div>
                    
                    `,
                },

            }
        })

        this.tabs.tab_ative('clips')

    }

}

g_sideR.init()