g_detailTabs.register('cut', {
    index: 1,
    onTabChanged: old => {

    },
    onVideoEvent: (type, { tab }) => {
        if (type == 'show') {

        }
    },
    tab: {
        id: 'cut',
        title: '<i class="ti ti-cut fs-2"></i>',
        html: `
		    <div class="row overflow-y-auto h-full" style="padding-bottom: 50px;">
		        <div class="col-12" id="cut_start">
		            <img src="res/default.jpg" class="w-full shadow border rounded-3">
		            <input class="form-control mt-1 float-end" style="width: 60%" placeholder="起点">
		        </div>
		        <div class="col-12 mt-2" id="cut_end">
		            <img src="res/default.jpg" class="w-full shadow border rounded-3">
		            <input class="form-control mt-1 float-end"  style="width: 60%" placeholder="终点">
		        </div>
		        <div class="col-12 mt-2">
		            <textarea id="cut_desc" class="form-control" placeholder="注释" rows="3"></textarea>
		            <div class="mt-2 w-full text-end">
		            	<label class="form-check form-check-inline">
	                        <input class="form-check-input" type="checkbox" id="checkbox_mark">
	                        <span class="form-check-label" title="你裁剪的片段其他人也可以看到">标记片段</span>
	                      </label>
		                <button class="btn btn-primary" data-action="cut_start">添加</button>
		            </div>
		        </div>
		    </div>
		    
		    `
    },
}, {
    init() {
        const self = this
        window.g_cut = self

        const onMouseWheel = (type, e) => {
            let video = g_episode.video_getObj()
            if (video) {
                e = e.originalEvent
                let duration = video.duration
                if (!isNaN(duration)) {
                    let key = g_hotkey.getInputCode(e, 'key')
                    let add = 1 // eval(opts[key]) ||
                    if (add < 1) add = 1;
                    self.addTime(type, e.deltaY > 0 ? 0 - add : add)
                    clearEventBubble(e);
                }
            }
        }

        $('#cut_start input').on('mousewheel', e => onMouseWheel('start', e))
        $('#cut_end input').on('mousewheel', e => onMouseWheel('end', e))

        g_hotkey.hotkey_register({
            'alt+digit1': {
                title: '设置裁剪起点',
                content: "doAction('cut_setStart')",
                type: 2,
            },
            'alt+digit2': {
                title: '设置裁剪终点',
                content: "doAction('cut_setEnd')",
                type: 2,
            },
            'alt+digit3': {
                title: '聚焦注释',
                content: "doAction('cut_desc')",
                type: 2,
            },
            'alt+digit4': {
                title: '开始裁剪',
                content: "doAction('cut_start')",
                type: 2,
            }
        })

        g_action.registerAction({
            cut_setStart: () => {
                g_detailTabs.tabs.tab_ative('cut')
                self.setTime('start')
            },
            cut_setEnd: () => {
                g_detailTabs.tabs.tab_ative('cut')
                self.setTime('end')
            },
            cut_desc: () => {
                g_detailTabs.tabs.tab_ative('cut')
            	$('#cut_desc').focus()
            },
            cut_start: dom => {
                let input = g_episode.video_getObj().src
                let { start, end } = self.times
                let time = end - start;
                if (end >= 0 && start >= 0 && !isNaN(time) && time > 0) {
                    g_detailTabs.tabs.tab_ative('clips')

                    let clip = Object.assign(g_clips.currentClip || {}, {
                        start,
                        end,
                        time,
                        desc: $('#cut_desc').val(),
                        isLocal: !$('#checkbox_mark').prop('checked')
                    })

                    g_clips.setClip(g_episode.currentVid, clip)
                    this.cutVideo(input, clip)
                }
            },

        })

    },

    cutVideo(input, clip) {
        this.clearInputs()

        let { start, time, isLocal } = clip
        let output = g_clips.getClipFile('video', clip)
        g_clips.setCover(clip, './res/loading.gif')
        g_ffmpeg.video_cut({
            input,
            output,
            duration: time,
            args: [
                `-ss ${start}`,
                `-t ${time}`,
            ],
            spawn: {
                env: getProxy(),
            }
        }, progress => {
            g_clips.setStatus(clip, progress)
        }, err => {
            g_clips.setStatus(clip, err ? '错误' : '', err ? 'red' : 'yellow')
            let cover = g_clips.getClipFile('cover', clip)
            g_ffmpeg.video_cover1({
                params: 0,
                input: output,
                output: cover,
                size: '240x180',
                spawn: { env: getProxy() }
            }, () => {
                setTimeout(() => g_clips.setCover(clip, cover), 1000)
            })

        })
    },

    jumpTo(type) {
        g_episode.video_getObj().currentTime = this.times[type]
    },
    setInputs({ start, end, desc, isLocal }, show = true) {
        this.setTime('start', start)
        this.setTime('end', end)
        $('#cut_start input').val(getTime(start))
        $('#cut_end input').val(getTime(start))
        $('#cut_desc').val(desc)
        $('#checkbox_mark').prop('checked', !isLocal)
        show && g_detailTabs.tabs.tab_ative('cut')
    },
    clearInputs() {
        this.setInputs({
            start: -1,
            end: -1,
            desc: '',
            isLocal: true,
        }, false)
    },
    times: { start: 0, end: 0 },
    addTime(type, time, jump = true) {
        return this.setTime(type, this.times[type] * 1 + time * 1, jump)
    },
    setTime(type, time, jump) {
        let video = g_episode.video_getObj()
        if (time == undefined) time = video.currentTime
        if (time == undefined) return

        time = time.toFixed(2)
        this.times[type] = time
        let { start, end } = this.times

        // if (start != undefined && end != undefined) {
        //     this.times.start = Math.min(start, end )
        //     this.times.end = Math.max(start, end )
        // }
        g_pp.setTimeout('coverTimer_' + type, () => {
            let img = $(`#cut_${type} img`)
            let cover = nodejs.dir + '\\' + type + '.jpg'
            nodejs.files.remove(cover)
            if (time >= 0) {
                g_ffmpeg.video_cover1({
                    params: time,
                    input: video.src,
                    output: cover,
                    size: '240x180',
                    spawn: { env: getProxy() }
                }, () => {
                    img.attr('src', cover + '?t=' + new Date().getTime())
                })
            }
            img.attr('src', 'res/' + (time >= 0 ? 'loading.gif' : 'default.jpg'))
        }, 500)

        $('#cut_start input').val(getTime(this.times.start))
        $('#cut_end input').val(getTime(this.times.end))
        jump && this.jumpTo(type)
    },


})