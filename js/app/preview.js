var g_preview = {
    init() {
        const self = this
        g_action.registerAction({
            preview_mute: dom => g_setting.toggleValue('preview_mute'),
            item_unpreview: (dom, action, e) => self.unpreview(e)
        })

        g_setting.
        onSetConfig('preview_mute', b => {
            replaceClass(getEle('preview_mute').find('i'), 'ti-', 'ti-volume' + (b ? '-off' : ''))
            self.getElement(' video')[0].muted = b
        })
    },
    getElement(s = '') {
        return $('#video_item_preview' + s)
    },
    unpreview(e) {
        if (g_menu.target && g_menu.target.hasClass('datalist-item')) { // 在视频上打开菜单
            return;
        }
        if (e && e.relatedTarget) {
            // 还在范围内
            if ($(e.relatedTarget).parents('#video_item_preview').length) return
        }
        $('.item_previewing').removeClass('item_previewing').
        find('#video_item_preview').remove()
    },
    getPreviewHtml(d) {

        let h = ''
        let file = g_item.item_getVal('file', d)
        let ext = getExtName(file)

        if (['mp3', 'wav', 'ogg'].includes(ext)) {
            h = `<video src="${file}" poster="${g_item.item_getVal('wave', d)}" class="w-full" autoplay loop {attr}></video>`
        } else
        if (['mp4'].includes(ext)) {
            h = `<video src="${file}" poster="${g_item.item_getVal('cover', d)}" class="w-full" autoplay loop {attr}></video>`
        } else
        if (['jpg', 'png', 'jpeg'].includes(ext)) {
            h = `<img src="${file}" class="mt-3 w-full" {attr}>`

        }
        return h
    },
    async fullPreview(md5) {
        this.unpreview()
        g_modal.modal_build({
            id: 'fullPreview',
            bodyClass: 'd-flex',
            type: 'fullscreen',
            once: true,
            hotkey: true,
            html: this.getPreviewHtml(await g_data.data_getData(md5)).replace('{attr}', 'controls'),
            width: '100%',
        })
    },
    video_get() {
        return $('#video_item_preview video')[0]
    },
    async preview(dom, md5, opts = {}) {
        let d = await g_data.data_getData(md5)
        opts = Object.assign(opts, {
            'alt': 1,
            'ctrl': 5,
            'shift': 'duration * 0.01',
            'alt+shift': 'duration * 0.05',
            'ctrl+shift': 'duration * 0.1',
        })
        // let width = dom.width
        let div = $(`
                <div id="video_item_preview" class="position-relative">
                    ${this.getPreviewHtml(d).replace('{attr}', `
            onclick = "toggleVideoPlay(this)"
            data - out = "item_unpreview"
            height = "${dom.height}px"
            `)}
                    <div class="progress position-absolute bottom-0 w-full" style="height: 3px; pointer-events: none;">
                      <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-label="Animated striped example" style="width: 0%"></div>
                    </div>
                    <a data-action="preview_mute" class="position-absolute top-5 end-5 rounded-circle btn p-1 "><i class="ti ti-volume"></i></a>
                    <span class="badge position-absolute end-5 bottom-10">
                        00:00:00
                    </span>
                </div>
            `).insertBefore(dom)

        g_setting.apply('preview_mute')

        let video = div.find('video')
        video[0].addEventListener('timeupdate', function(e) {
            div.find('.badge').html(getTime(this.currentTime))
            div.find('.progress-bar').css('width', (this.currentTime / this.duration * 100).toFixed(1) + '%')
        })
        setTimeout(() => {
            let last = 0
            video.
            on('mousemove', function(e) {
                let pos = e.originalEvent.offsetX / $(this).width();
                if (Math.abs(last - pos) >= 0.005) {
                    video[0].currentTime = video[0].duration * pos
                }
                last = pos
            }).
            on('mousewheel', function(e) {
                if (!$('input:focus').length) {
                    e = e.originalEvent
                    let key = g_hotkey.getInputCode(e, 'key')
                    if (key == '') return;
                    let video = e.currentTarget
                    let duration = video.duration
                    if (!isNaN(duration)) {
                        let add = eval(opts[key]) || 1
                        if (add < 1) add = 1;
                        video.currentTime += e.deltaY > 0 ? 0 - add : add;
                        clearEventBubble(e);
                    }
                }
            })
        }, 1000) // 延迟绑定
    }
}

g_preview.init()