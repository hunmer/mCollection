const Store = require('electron-store');
const store = new Store({
    devTool: false,
    showFrame: false,
    fullScreen: true,
});

let g_cache = {}
store.bindWinddow = function(win) {
    if (this.has('bounds')) {
        win.setBounds(this.get('bounds'))
    } else
    if (this.get('fullScreen')) {
        win.maximize();
    }
    const savePos = () => {
        if (g_cache.savePos) clearTimeout(g_cache.savePos);
        g_cache.savePos = setTimeout(() => {
            this.set('bounds', win.getBounds());
            delete g_cache.savePos;
        }, 1000);
    }
    win.on('move', (event) => {
        savePos();
    });
    win.on('resize', (event) => {
        savePos();
    });
}

module.exports = store