var child_process = require('child_process');
const iconv = require("iconv-lite");

function run(exe, cmds, opts = {}, events = {}) {
    if (!Array.isArray(cmds)) cmds = cmds.split(' ');
    opts = Object.assign({
        shell: true,
        // cwd: '',
        windowsHide: true,
        maxBuffer: 1024 * 3000,
    }, opts || {})
    console.log(exe, cmds.join(' '), opts);
    let child = child_process.spawn(exe, cmds, opts);

    // 中文要用iconv 英文就不能用
    if (events.onOutput) {
        let output = d => events.onOutput(opts.iconv ? iconv.decode(Buffer.from(d, 'binary'), 'cp936').trim() : d.toString())
        child.stdout.on('data', output)
        child.stderr.on('data', output)
    }

    if (events.onError) {
        child.on('error', function() {
            events.onError.apply(this, arguments);
        })
        // child.on('exit', function() {
        //     events.onError.apply(this, arguments);
        // })
    }
    events.onExit && child.on('close', function() {
        events.onExit.apply(this, arguments);
    })
    events.onRestart && child.on('restart', function() {
        events.onRestart.apply(this, arguments);
    })

    return child;
}

var g_tasks = {};

function task_killAll() {
    for (let id in g_tasks) {
        g_tasks[id].kill();
    }
    g_tasks = {};
}

function task_add(key, task) {
    g_tasks[key] = task;
}

function ffmpeg1(cmd, opts, events) {
    var opts1 = {};
    if (opts.progress) {
        delete opts.progress;
        const getValue = (key1, key2, str) => {
            var m = str.match(new RegExp(key1 + '(.*?)' + key2));
            return m ? m[1] : '';
        }

        opts1.onOutput = function(msg) {
            let r = getValue('time=', ' bitrate=', msg.toString());
            if (r != '') events.onTimeupdate(r);
        }
    }
    var child = run(__dirname + `/bin/ffmpeg.exe`, cmd, opts.spawn, Object.assign(events, opts1))
    task_add(new Date().getTime(), child);
}

function ffprobe(file, opts = {}, events) {
    return new Promise(reslove => {
        var s = '';
        var child = run(__dirname + `/bin/ffprobe.exe`, `-v quiet -show_streams -show_format -print_format json "${file}"`, opts, Object.assign(events || {}, {
            onOutput: function(msg) {
                s += msg;
            },
            onExit: () => {
                reslove(JSON.parse(s));
            }
        }))
    })
}

function ytdl_parse(url, opts = {}) {
    return new Promise((reslove, reject) => {
        let cmd = __dirname + `/bin/yt-dlp.exe -j "${url}"`;
        child_process.exec(cmd, Object.assign(opts, { maxBuffer: 1024 * 3000, shell: true }), function(err, stdout, stderr) {
            if (err) return reject(err)
            reslove(stdout || stderr)
        })
    })
}

function toTime(s) {
    var a = s.split(':');
    if (a.length == 1) return s;
    if (a.length == 1) return Number(s);
    if (a.length == 2) {
        a.unshift(0);
    }
    return a[0] * 3600 + a[1] * 60 + a[2] * 1;
}

class ffmpeg {
    events = {}
    output = ''
    constructor(input, opts = {}) {
        this.args = ['-y', ...(opts.args || [])]
        delete opts.args
        this.setInput(input);
        this.opts = opts;
        return this;
    }
    outputOptions(args, keeps = []) {
        if (keeps.length) {
            let arr = [];
            keeps.forEach(k => {
                let s = this.getParam(k);
                if (s != undefined) arr.push(k + (s != '' ? ' ' + s : ''));
            })
            this.args = arr;
        }
        this.args = Array.from(new Set([...args, ...this.args]))
        return this;
    }
    getInput() {
        return this.getParam('-i', '');
    }
    setParam(key, val) {
        val = key + ' ' + val;
        if (!this.args.some((arg, i) => {
                if (arg.startsWith(key)) {
                    this.args[i] = val;
                }
            })) {
            this.args.push(val);
        }
        return this;
    }
    getParamIndex(key) {
        return this.args.findIndex(arg => arg.startsWith(key));
    }
    getParam(key, defV) {
        let index = this.getParamIndex(key);
        if (index < 0) return defV;
        let arr = this.args[index].split(' ');
        arr.shift();
        var val = arr.join(' ');
        if (val.substr(0, 1) == '"' && val.substr(-1) == '"') {
            val = val.substr(1, val.length - 2);
        }
        return val;
    }
    videoCodec(codec) {
        return this.setParam('-vcodec', codec);
    }
    audioCodec(codec) {
        return this.setParam('-acodec', codec);
    }
    setInput(file) {
        return this.setParam('-i', `"${file}"`);
    }
    save(saveTo) {
        this.output = `"${saveTo}"`;
        return this.start();
    }
    getCmd() {
        let args = [...this.args];
        args.push(this.output);
        // 听说把-ss放在最前面可以提高速度
        let i = this.getParamIndex('-ss')
        if (i > 0) {
            args.unshift(args.splice(i, 1))
        }
        return args.join(' ')
    }
    async start() {
        if (this.opts.meta) { // 将保存媒体信息
            this.meta = await ffprobe(this.getInput());
        }
        // .replace(/ /g,"\\\ ");
        let cmd = this.getCmd();
        this.emit('start', cmd);
        this.process = ffmpeg1(cmd, this.opts, {
            onTimeupdate: time => {
                this.emit('progress', this.meta ? Math.min(parseInt(toTime(time) / parseInt(this.meta.format.duration) * 100), 100) : time);
            },
            onError: err => {
                console.error(err);
                this.emit('error', err);
            },
            onExit: _process => {
                this.emit('end', _process);
            }
        });
    }

    on(eventName, callback) {
        this.events[eventName] = callback;
        return this;
    }

    emit(eventName, ...args) {
        this.events[eventName] && this.events[eventName].apply(this, args);
        return this;
    }

    kill() {
        this.process.kill();
    }

    getAvailableCodecs(callback) {
        let r = { V: {}, A: {} };
        let s = '';
        ffmpeg1('-encoders', {}, {
            onOutput: msg => {
                s += msg;
            },
            onExit: code => {
                for (let line of s.split('\n')) {
                    line = line.trim();
                    let key = line.substr(0, 1);
                    if (r[key]) {
                        let arr = line.replaceAll('  ', ' ').split(' ');
                        let name = arr[1];
                        if (name == '=') continue;
                        let val = '';
                        arr.reverse().some(s1 => {
                            val = s1 + ' ' + val;
                            return s1 == '';
                        });
                        r[key][name] = val.trim();
                    }
                }
                callback(r);
            }
        });
        return this;
    }

    screenshots(opts) {
        // TODO 单张的不需要获取时长
        let file = this.getParam('-i').trim('');
        // if(opts.size){

        // }
        let out = [`-i "${file}"`, '-y', ] // -i 必须在最前面
        if (this.meta) {
            let duration = this.meta.format.duration;
            let video = this.meta.streams[0];
            if (opts.size) {
                let size = opts.size.split('x');
                let r = video.width / video.height;
                if (size[0] == '?') {
                    size[1] = parseInt(size[1]);
                    size[0] = parseInt(r ? size[1] * r : size[1] / r);
                } else
                if (size[1] == '?') {
                    size[0] = parseInt(size[0]);
                    size[1] = parseInt(r ? size[0] / r : size[0] * r);
                }
                out.push(`-s ${size[0]}x${size[1]}`)
            }
            if (typeof(opts.count) == 'number') { // 生成指定数量
                let count = parseInt(opts.count); // 会有偏差
                out = out.concat('-vsync 0', `-vf select="not(mod(n\\,${parseInt(video.nb_frames / count)}))"`);
                return this
                    .outputOptions(out)
                    .save(opts.folder + '/' + opts.filename);
            }
        }

        if (!Array.isArray(opts.timestamps)) {
            opts.timestamps = [opts.timestamps];
        }

        let cnt = 0;
        opts.timestamps.forEach((time, i) => {
            let args = [...out];
            // , '-r 1'
            args.unshift(`-ss ${time}`);
            // -vframes 1', 
            args.push(`"${opts.folder}/${opts.filename.replace('{i}', i)}"`);
            ffmpeg1(args.join(' '), this.opts || {}, {
                onOutput: msg => {
                    if (msg.indexOf('global headers:') != -1) {
                        this.emit('progress', ++cnt / opts.timestamps.length);
                    }
                },
                onError: err => {
                    this.emit('error', err);
                },
                onExit: code => {
                    this.emit('end', code);
                }
            });
        })

        return this;
    }
}

// var command = new ffmpeg('K:\\movies\\aa.mp4', {
//     progress: true,
//     meta: true,
//     env: { proxy: 'http://127.0.0.1:1080', http_proxy: 'http://127.0.0.1:1080', https_proxy: 'http://127.0.0.1:1080' },
// }).outputOptions([]);
// command
//     // .setInput()
//     // .videoCodec('copy')
//     // .audioCodec('copy')
//     .on('start', function(cmd) {
//         console.log('ffmpeg '+ cmd);
//     })
//     .on('progress', function(progress) {
//         console.log('progress', progress);
//     })
//      .on('output', function(progress) {
//         console.log('output', progress);
//     })
//     .on('error', function(e) {
//         console.log('error', e);
//     })
//     .on('end', function(str) {
//         console.log('end');
//     })
//     .screenshots({
//         count: 20,
//         // timestamps: [1, 2],
//         folder: 'C:/Users/liaoyanjie/Desktop/a',
//         filename: 'screenshot%03d.jpg',
//         // filename: 'screenshot{i}.jpg',
//         size: '160x?'
//     })
// .save('C:/Users/liaoyanjie/Desktop/out.mp4');



// ffmpeg1(`-i "C:\\Users\\liaoyanjie\\Desktop\\[1655487765727]标签1 , 标签2_我是备注.mp4" -y -acodec copy -vcodec libx264 -y -ss 0 -t 2 "C:\\Users\\liaoyanjie\\Desktop\\b.avi"`, {
//     progress: true,
//      env: { proxy: 'http://127.0.0.1:1080', http_proxy: 'http://127.0.0.1:1080', https_proxy: 'http://127.0.0.1:1080' },
// }, {
//     onTimeupdate: s => {
//         console.log(s);
//     },
// });
// task_killAll();

// ffprobe('C:\\Users\\liaoyanjie\\Desktop\\[1655487765727]标签1 , 标签2_我是备注.mp4').then(meta => {
//     console.log(meta);
// })

module.exports = {
    ffmpeg,
    run,
    ffprobe,
    ytdl_parse,
    task_killAll,
}