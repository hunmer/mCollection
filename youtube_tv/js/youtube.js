class videoData {
    constructor(key, data, opts) {
        g_videoDatas.inst[key] = this
        this.key = key
        this.data = data
        this.opts = opts
        return this
    }
    save() {
        g_episode.playlist_saveVideo(this.key, this.data)
    }
    get(key, def) {
        if (Array.isArray(key)) {
            return key.map(k => this.data[k])
        }
        return this.data[key] || def
    }
    set(key, val, save = true) {
        this.data[key] = val
        save && this.save()
    }
    find(key, callback) {
        return this.data[key].find((item, i) => callback(item, i))
    }
    findFormat(filter) {
        if (typeof(filter) != 'object') filter = { format_id: filter }
        return this.find('formats', item => {
            let ok = true
            for (let [k, v] of Object.entries(filter)) {
                if (typeof(v) == 'function') {
                    ok = v(item[k])
                } else {
                    if (!Array.isArray(v)) v = [v]
                    if (!v.includes(item[k])) {
                        ok = false
                    }
                }
                if (!ok) break
            }
            if (ok) {
                return true
            }
        })
    }

    setClip(vals) {
        let clips = this.get('clips', [])
        let index = clips.findIndex(clip => clip.start == vals.start && clip.end == vals.end)
        if (index == -1) {
            if (vals.remove) return
            index = clips.length
        } else {
            if (vals.remove) {
                clips.splice(index, 1)
                index = -1
            }
        }
        if (index >= 0) clips[index] = vals
        this.set('clips', clips)
    }

    load() {
        g_cache.sbWidth = 100
        if(!getEle('episode_covers').hasClass('text-primary')) this.loadStoryBoard()
        this.loadURL()
        return this
    }

    loadStoryBoard(method = 'html') {
        // 加载雪碧图
        $('#episode_sb')[method](g_videoDatas.parseStoryBoard(this.findFormat('sb0'), this.key,  this.get('fulltitle')))
    }

    loadURL(skip = false) {
        let link = 'https://www.youtube.com/watch?v=' + this.get('id')
        let poster = this.get('thumbnail')

        const load = url => {
            console.log(url)
            this.loadTab(this.key, {
                poster,
                file: url,
            })
        }

        if (skip || getConfig('autoPlay')) {
            // 加载最高画质视频
            this.getPlayAdress(url => load(url))
        } else {
            load('')
        }


        // 加载视频
        // for (let format_note of ['1080p', '720p', '480p', '360p', '240p', '140p']) {
        //     let video = this.findFormat({
        //         format_note,
        //         video: v => v != 'none',
        //         audio: v => v != 'none'
        //     })
        //     if (video) {
        //         console.log(video)
        //         // 先插入video占位，展示封面
        //        


        //         // load('http://127.0.0.1/a.mp4')
        //         // return this
        //         let { format_id, size } = video
        //         if (false) {
        //             $.getJSON('https://api.youtubemultidownloader.com/video?url=' + link, function(json, textStatus) {
        //                 if (textStatus == 'success') {
        //                     load(json.format.find(format => format.id == format_id).url)
        //                 }
        //             })
        //         } else {
        //             this.runCmd(`-g -f ${format_id} "${link}"`, {
        //                 onOutput: url => load(url)
        //             })
        //         }
        //         break
        //     }
        // }
    }

    runCmd(cmd, events, opts = {}) {
        Object.assign(opts, {
            env: {
                proxy: getProxy()
            }
        })
        if (this.child) {
            nodejs.kill(this.child.pid, 'SIGKILL')
        }
        this.child = nodejs.cli.run(nodejs.path.resolve(__dirname, '..\\bin\\yt-dlp.exe'), cmd, opts, events)
        return this.child
    }

    getPlayAdress(callback) {
        this.runCmd(`-g -f best "https://www.youtube.com/watch?v=${this.get('id')}"`, {
            onOutput: url => {
                if (url.startsWith('http')) callback(url)
            }
        })
    }

    loadTab(value, data) {
        // let arr = url.split('.')
        // arr[0] = 'https://redirector'
        // url = arr.join('.')

        getConfig('oneTab') && g_videoTabs.tabs.clear()
        let find = g_videoTabs.tab_new({
            data,
            value,
            title: this.get('id'),
        })
        if (find) { // 已存在

        }
    }
}

var g_videoDatas = {
    inst: {},
    init() {

    },

    getCurrentData() {
        return this.inst[g_episode.currentVid]
    },

    parseStoryBoard(data, vid, title) {
        let h = ''
        let { fragments, columns, rows } = data

        let totalDuration = 0
        fragments.forEach(({ url, duration }) => {
            h += `<img src="${url}" class="w-full sb mx-auto" data-vid="${vid}" data-title="${title}" data-tip="{time}<br>{title}" data-cols=${columns} data-rows=${rows} data-start=${totalDuration} data-duration=${duration}>`
            totalDuration += duration
        })
        return h
    }

}

g_videoDatas.init()