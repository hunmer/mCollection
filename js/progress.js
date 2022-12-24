class Progress {
    constructor(id, opts) {
        opts = Object.assign({
            log: true,
            logText: '',
            autoClose: false,
            onClose: () => {},
            maxLogs: 1000,
            onProgress: val => {}
        }, opts)
        this.id = id
        this.opts = opts
        this.sloved = []
        this.val = 0
        this.logCnt = 0
        g_progress.set(id, opts)
    }

    build(callback) {
        // g_progress.remove(id)
        // progress-bar-indeterminate
        callback(`
        	<div id="_progress_${this.id}">
				<div class="d-flex align-items-center">
					<div>
						<span class="status-indicator status-blue status-indicator-animated">
						  <span class="status-indicator-circle"></span>
						  <span class="status-indicator-circle"></span>
						  <span class="status-indicator-circle"></span>
						</span>
					</div>
					<div class="w-full">
						<div class="progress" style="height: 20px;">
						  <div class="progress-bar progress-bar-animated" role="progressbar" style="width: 0%;">0%</div>
						</div>
					</div>
				</div>
				<div class="hr-text">Logs</div>
				<code>

				</code>
			</div>
		`)
        return this
    }
    getContent() {
        return $('#_progress_' + this.id)
    }
    setSloved(k, b = true, text = '') {
        let i = this.sloved.indexOf(k)
        if (i == -1) {
            if (b) {
                this.sloved.push(k)
                this.addLog((text || this.opts.logText).replace('%%s%%', k))
            }
        } else
        if (!b) {
            this.sloved.splice(i, 1)
        }
        this.updateProgress()
        return this
    }
    addLog(text) {
        if (text != '' && this.opts.log) {
            let div = this.getContent().find('code')
            let max = this.opts.maxLogs
            if(max > 0 && ++this.logCnt % max === 0){
                div.html('')
            }
            div.append(text)
        }
    }
    updateProgress() {
        let max = Object.keys(this.opts.datas).length
        let i = parseInt(this.sloved.length / max * 100)
        this.setProgress(i)
    }
    setProgress(val) {
        if (val != this.val) {
            this.opts.onProgress(val) // 进度更新
            this.getContent().find('.progress-bar').css('width', val + '%').html(val + '%')
            if (val >= 100) {
                this.setStatus('success', false, true)
                this.addLog('<p>结束...</p>')
                if (this.opts.autoClose) {
                    this.destroy()
                    this.opts.onClose() // 用户自定义close函数,可能是被modal包裹着的
                }
            }

        }
        this.val = val
    }
    setStatus(status, animate = true, progress = false) {
        let div = this.getContent()
        div.find('.status-indicator').attr('class', 'status-indicator status-' + status + (animate ? ' status-indicator-animated' : ''))
        progress && replaceClass(div.find('.progress-bar'), 'bg-', 'bg-' + status)
        return this
    }

    destroy() {
        g_progress.remove(this.id)
        this.getContent().remove()
    }

}

var g_progress = {
    init() {

    },
    list: {},
    set(id, opts) {
        this.list[id] = opts
    },
    get(k) {
        return this.list[k]
    },
    remove(k) {
        delete this.list[k]
    },
    getContent(id) {
        return $('#_progress_' + id)
    },

}
g_progress.init()

// let datas = ['a', 'b']
// let progress = new Progress('update', {
//     datas: datas,
//     autoClose: false,
//     logText: '<p>√ 成功下载: %%s%%</p>',
//     onProgress: i => {
//     	if(i >= 100){
//     		g_modal.modal_get('progress_update').find('#btn_ok').html('完成')
//     	}
//     },
//     onClose: function() {
//         g_modal.remove('progress_update')
//     }
// }).build(html => {
//     alert(html, {
//         id: 'progress_update',
//         title: '更新文件中...',
//         btn_ok: '取消',
//     }).then(() => {
//     	progress.destroy()
//     	if(progress.val >= 100) {
//     		location.reload()
//     	}
//     })
// })

// let i = 0
// for (let item of datas) {
//     setTimeout(() => {
//         progress.setSloved(item)
//     }, ++i * 1000)
// }