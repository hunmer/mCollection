const fs = require("fs-extra");
var { shell } = require('electron');
const crypto = require('crypto')
var spawn = require("child_process").spawn;

function replaceAll_once(str, search, replace, start = 0) {
    if (typeof(str) != 'string') return ''
    while (true) {
        var i = str.indexOf(search, start);
        if (i == -1) break;
        start = i + search.length;
        str = str.substr(0, i) + replace + str.substr(start, str.length - start);
        start += replace.length - search.length;
    }
    return str;
}

const path = require("path");

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    }
    if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
    }
}
const files = {
    safePath: str => {
        str = str.replaceAll('\\', '＼')
        str = str.replaceAll('/', '／')
        str = str.replaceAll(':', '：')
        str = str.replaceAll('*', '＊')
        str = str.replaceAll('?', '？')
        str = str.replaceAll('"', '＂')
        str = str.replaceAll('<', '＜')
        str = str.replaceAll('>', '＞')
        str = str.replaceAll("|", "｜")
        return str
    },
    safeSql: str => {
        str = str.replaceAll('/', '//')
        str = str.replaceAll('[', '/[')
        str = str.replaceAll(']', '/]')
        str = str.replaceAll('%', '/%')
        str = str.replaceAll('&', '/&')
        str = str.replaceAll('_', '/_')
        str = str.replaceAll('(', '/(')
        str = str.replaceAll(')', '/)')
        str = str.replaceAll("'", "''")
        return str
    },
    renderSize: value => {
        if (null == value || value == '') {
            return "0 Bytes";
        }
        var unitArr = new Array("Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");
        var index = 0;
        var srcsize = parseFloat(value);
        index = Math.floor(Math.log(srcsize) / Math.log(1024));
        var size = srcsize / Math.pow(1024, index);
        size = size.toFixed(2); //保留的小数位数
        return size + unitArr[index];
    },
    getAppData: () => process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share"),
    getFileMd5: (file) => {
        const buffer = fs.readFileSync(file);
        const hash = crypto.createHash('md5');
        hash.update(buffer, 'utf8');
        return hash.digest('hex');
    },
    getMd5: (s) => {
        return crypto.createHash('md5').update(s).digest("hex")
    },
    getFileName: (file, ext = true) => {
        let name = path.basename(file, '')
        if (!ext) {
            name = name.split('.')
            name.pop()
            return name.join('.')
        }
        return name
    },
    runCmd: (cmd, callback, onClose) => {
        return new Promise(function(resolve, reject) {
            var result = spawn('cmd.exe ', ['/s', '/c', cmd], { shell: true });
            result.on('close', function(code) {
                if (typeof(onClose) == 'function') onClose(code);
            });
            result.stdout.on('data', function(data) {
                callback(iconvLite.decode(data, 'cp936'));
            });
            resolve();
        });
    },
    openFile: (path) => {
        if (!fs.existsSync(path)) return false
        shell.openPath(path)
        return true
    },
    openFileInFolder: (path) => {
        if (!fs.existsSync(path)) return false
        shell.showItemInFolder(path)
        return true
    },
    readFile: (file) => {
        if(fs.existsSync(file)){
            return fs.readFileSync(file)
        }
    },
    read: (file, def) => {
        return fs.existsSync(file) ? fs.readFileSync(file).toString() : def
    },
    exists: (path) => {
        return fs.existsSync(path)
    },
    isFile: (path) => fs.existsSync(path) && fs.statSync(path).isFile(),
    isDir: (path) => fs.existsSync(path) && fs.statSync(path).isDirectory(),
    mkdir: (dir) => {
        return mkdirsSync(dir)
    },
    makeSureDir: (file) => {
        mkdirsSync(path.dirname(file))
    },
    write: (file, content) => {
        files.mkdir(path.dirname(file)) && fs.writeFileSync(file, content)
    },
    searchDirFiles: (dir, list, fileExts, C) => {
        fs.readdirSync(dir).forEach(fileName => {
            var path = files.join(dir, fileName);
            if (files.isDir(path) && ((!C && C != 0) || C > 0)) {
                if (files.isEmptyDir(path)) return; // files.removeDir(path);
                files.searchDirFiles(path, list, fileExts, C - 1);
                return;
            }
            for (var i = 0; i < fileExts.length; i++) {
                if (fileName.endsWith(fileExts[i])) {
                    list.push(path);
                    return;
                }
            }
        });
    },
    dirFiles(dirs, fileExts, callback) {
        let list = [];
        if(!Array.isArray(dirs)) dirs = [dirs]
        dirs.forEach(dir => {
            if(files.isDir(dir)){
                this.searchDirFiles(dir, list, fileExts)
            }
        })
        callback(list)
    },
    items: (dir) => {
        var r = {
            base: dir,
            paths: [],
            files: [],
        }
        fs.readdirSync(dir).forEach(fileName => {
            var path = files.join(dir, fileName);
            if (files.isDir(path)) {
                r.paths.push(fileName);
            } else {
                r.files.push(fileName);
            }
        });
        return r;

    },
    getExtension: (file) => path.extname(file).replace('.', ''),
    remove: (file) => {
        fs.existsSync(file) && fs.rmSync(file)
    },
    copySync: (oldFile, newFile) => {
        files.mkdir(path.dirname(newFile));
        fs.copyFileSync(oldFile, newFile);
        return fs.existsSync(newFile);
    },
    copy: (oldFile, newFile, data, callback) => {
        files.mkdir(path.dirname(newFile));
        fs.promises.copyFile(oldFile, newFile).then(err => {
            callback && callback(err, data);
        });
    },
    move(oldFile, newFile, data, callback) {
        if (fs.existsSync(oldFile)) {
            this.makeSureDir(newFile)
            let is = fs.createReadStream(oldFile);
            let os = fs.createWriteStream(newFile);
            is.pipe(os);
            is.on('end', function() {
                fs.unlinkSync(oldFile);
                callback && callback(undefined, data);
            });
        }
    },
    copyMove: (oldFile, newFile) => {
        fs.copyFileSync(oldFile, newFile);
        fs.unlinkSync(oldFile);
        // fs.renameSync(oldFile, newFile);
        return fs.existsSync(newFile);
    },
    join: (dir, file) => path.join(dir, file),
    listDir: (dir) => {
        var res = [];
        fs.readdirSync(dir).forEach(function(name) {
            var filePath = path.join(dir, name);
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                res.push(filePath);
            }
        });
        return res;
    },
    getImageBase64(file) {
        return 'data: image/' + getImageType(file) + ';base64,' + new Buffer(fs.readFileSync(file), 'binary').toString('base64');
    },
    isEmptyDir: (dir) => fs.readdirSync(dir).length == 0,
    removeDir: (dir) => fs.rmSync(dir, { recursive: true, force: true }),
    stat: (file) => files.exists(file) && fs.statSync(file),
}

function getImageType(str){
    var reg = /\.(png|jpg|gif|jpeg|webp)$/;
    return str.match(reg)[1];
}


module.exports = files;