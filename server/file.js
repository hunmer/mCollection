const fs = require("fs");
const path = require("path");
const crypto = require('crypto')

const files = {
    getFileMd5: (file) => {
        const buffer = fs.readFileSync(file);
        const hash = crypto.createHash('md5');
        hash.update(buffer, 'utf8');
        return hash.digest('hex');
    },
    getMd5: (s) => {
        return crypto.createHash('md5').update(s).digest("hex")
    },
    mkdir: (dir) => {
        if (fs.existsSync(dir)) {
            return true;
        }
        if (files.mkdir(path.dirname(dir))) {
            fs.mkdirSync(dir);
            return true;
        }
    },
    copy: (oldFile, newFile, data, callback) => {
        files.mkdir(path.dirname(newFile));
        fs.promises.copyFile(oldFile, newFile).then(err => {
            callback && callback(err, data);
        });
    },
    exists: (path) => {
        return fs.existsSync(path)
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
    splitName: (file) => {
        let arr = path.basename(file, '').split('.')
        let ext = arr.length > 1 ? arr.pop() : ''
        return { ext, name: arr.join('.') }
    },
    stat: (file) => files.exists(file) && fs.statSync(file),
    guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
module.exports = files;