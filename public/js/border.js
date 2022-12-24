var g_border = {
    init(funs = {}) {
        const self = this


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
				margin-right: 10px;
			}
			#dragBar i{
				font-size: 1.2rem;
			}


		</style>`).prependTo('main')

        this.bar = $(`<div id="dragBar" class="d-flex"></div>`).appendTo('main')

        setInterval(() => {
            let title = document.title
            if (title != self.title) {
                self.title = title
                $('#_title').find('b').html(title)
            }
        }, 500)

        g_action.
        registerAction(['pin', 'max', 'min', 'close'], (dom, action) => ipc_send(action[0]))

        let init = funs.init
        if (init) {
            funs.init.apply(this)
            delete funs.init
        }
        Object.assign(this, funs)
        return this

    },

    destroy() {
        this.style.remove()
        this.bar.remove()
    }
}