g_extraTabs.register('cut', {
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
		        <div class="col-3 p-4" id="cut_start">
		            <img src="res/default.jpg" class="w-full shadow border rounded-3">
		            <input class="form-control mt-1" placeholder="起点">
		        </div>
		        <div class="col-3 p-4" id="cut_end">
		            <img src="res/default.jpg" class="w-full shadow border rounded-3">
		            <input class="form-control mt-1" placeholder="终点">
		        </div>
		        <div class="col p-4">
		           
		        </div>
		    </div>
		    `
    },
}, {
    init() {
        const self = this
        window.g_cut = self

        const onMouseWheel = (type, e) => {
            let video = g_player.getPlayer().video
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
            'alt+digit4': {
                title: '开始裁剪',
                content: "doAction('cut_start')",
                type: 2,
            }
        })

        g_action.registerAction({
            cut_setStart: () => {
                g_extraTabs.tabs.tab_ative('cut')
                self.setTime('start')
            },
            cut_setEnd: () => {
                g_extraTabs.tabs.tab_ative('cut')
                self.setTime('end')
            },
            async cut_start(dom){
                let input = await g_player.getPlayer().getURL(true)
                let { start, end } = self.times
                let time = end - start;
                if (end >= 0 && start >= 0 && !isNaN(time) && time > 0) {
                    g_extraTabs.tabs.tab_ative('clips')
                    let clip = Object.assign(g_clips.currentClip || {}, {
                        start,
                        end,
                        time,
                    })
                    g_clips.addClip(clip)
                    self.cutVideo(input, clip)
                }
            },

        })

    },

    cutVideo(input, clip) {
        this.clearInputs()
        let { start, time } = clip
        // .replace('.mp4', '.ts')
        // BUG M3U8不能设置MP4编码
        let output = g_clips.getClipFile('video', clip)
        g_clips.setCover(clip, './res/loading.gif')
        // TODO 如果为m3u8 则不加编码
        g_ffmpeg.video_cut({
            input,
            output,
            duration: time,
            args: [
                `-ss ${start}`,
                `-t ${time}`,
                // '-vcodec libx264',
                // '-acodec copy',
                // `-user_agent "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36 Edg/103.0.1264.71"`,
                // `-headers "Authorization: fudkmnso-... ...9-0sdf-0ea"$'\r\n'"Xplay-session-ID:9885998"`,
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
        g_player.getPlayer().setCurrentTime(this.times[type])
    },
    setInputs({ start, end }, show = true) {
        this.setTime('start', start)
        this.setTime('end', end)
        $('#cut_start input').val(getTime(start))
        $('#cut_end input').val(getTime(start))
        show && g_extraTabs.tabs.tab_ative('cut')
    },
    clearInputs() {
        this.setInputs({
            start: -1,
            end: -1,
        }, false)
    },
    times: { start: 0, end: 0 },
    addTime(type, time, jump = true) {
        return this.setTime(type, this.times[type] * 1 + time * 1, jump)
    },
    setTime(type, time, jump) {
        let player =g_player.getPlayer()
        if (time == undefined) time = player.getCurrentTime()
        if (time == undefined) return

        time = time.toFixed(2)
        this.times[type] = time
        let { start, end } = this.times

        // if (start != undefined && end != undefined) {
        //     this.times.start = Math.min(start, end )
        //     this.times.end = Math.max(start, end )
        // }
        g_pp.setTimeout('coverTimer_' + type, async () => {
            let img = $(`#cut_${type} img`)
            let cover = nodejs.dir + '\\' + type + '.jpg'
            nodejs.files.remove(cover)
            if (time >= 0) {
                let player = g_player.getPlayer()
                 // getImgBase64($(player.video)).then(src => img.attr('src', src))
                 if(player.player.type != 'hls'){ // m3u8 
                     g_ffmpeg.video_cover1({
                        params: time,
                        input: await player.getURL(true),
                        output: cover,
                        size: '240x180',
                        spawn: { env: getProxy() }
                    }, () => {
                        img.attr('src', cover + '?t=' + new Date().getTime())
                    })
                 }else{
                    time = -1
                 }
            }
            img.attr('src', 'res/' + (time >= 0 ? 'loading.gif' : 'default.jpg'))
        }, 500)
        $('#cut_start input').val(getTime(this.times.start))
        $('#cut_end input').val(getTime(this.times.end))
        jump && this.jumpTo(type)
    },


})