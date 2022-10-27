
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
                callback(filePath, stat);
        } else if (stat.isDirectory()) {
            if(['node_modules', 'build', 'download', 'downloads', 'scripts', 'cache', 'test', 'extensions', '.git', 'database'].indexOf(filePath) == -1){
                walkSync(filePath, callback);
            }
        }
    });
}
var res = {};
walkSync('.', function (filePath, stat) {
    if(['README.md', 'config.json','.gitignore', '.gitattributes', 'LICENSE.md', 'listFile.json'].indexOf(filePath) == -1){
        const stream = fs.createReadStream(path.join(__dirname, filePath));
        const hash = crypto.createHash('md5');
        stream.on('data', chunk => {
          hash.update(chunk, 'utf8');
        });
        stream.on('end', () => {
          res[filePath] = hash.digest('hex');
        });
    }
});

process.on('exit', code => {
  fs.writeFileSync('listFile.json', JSON.stringify(res), (err) => {});
});