// doAction(null, 'addfiles')
g_fileDrop.init()
// g_fileDrop.register('folder', {
//     selector: '#accordion-group-folder',
//     layout: ``,
//     exts: g_format.getFormats(),
//     onParse(r) {
//         // TODO 专门处理目录拖动的窗口...
//         for (let dir of r.dirs) {
//             nodejs.files.dirFiles(dir, this.exts, files => {
//                 r.files = r.files.concat(files)
//             })
//         }
//         // self.file_revice(r.files)
//         console.log(r.files)
//     }
// })