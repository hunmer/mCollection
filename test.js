
const chokidar = require('chokidar');
const watcher = chokidar.watch('./test/*.mp4', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

const log = console.log.bind(console);
// watcher
//   .on('add', path => log(`File ${path} has been added`))
//   .on('change', path => log(`File ${path} has been changed`))
//   .on('unlink', path => log(`File ${path} has been removed`));

watcher
  // .on('addDir', path => log(`Directory ${path} has been added`))
  // .on('unlinkDir', path => log(`Directory ${path} has been removed`))
  .on('error', error => log(`Watcher error: ${error}`))
  .on('ready', () => log('Initial scan complete. Ready for changes')) // 初次调整完成

// 'add', 'addDir' and 'change' events also receive stat() results as second
// argument when available: https://nodejs.org/api/fs.html#fs_class_fs_stats
watcher.on('change', (path, stats) => {
  if (stats){
    console.log(`File ${path} changed size to ${stats.size}`);
  }
});

// setTimeout(() => watcher.close().then(() => console.log('closed')), 1000 * 60 )
