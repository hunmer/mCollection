const { getCurrentWindow, getCurrentWebContents, shell, Menu } = require('@electron/remote');
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    send
})

const _app = getCurrentWindow();
const _webContent = getCurrentWebContents();

ipcRenderer.on('msg', (event, arg) => {
    doAction(arg);
});

ipcRenderer.on('close', (event, arg) => {
    _webContent.destroy() // 好像只会触发destoryed事件，其他没啥卵用
});

function doAction(arg) {
    switch (arg.type) {
        case 'home':
            return window.scrollTo(0, 0);
        case 'end':
            return window.scrollTo(0, document.body.scrollHeight);
        case 'forward':
            return _webContent.canGoForward() && _webContent.goForward();
        case 'back':
            return _webContent.canGoBack() && _webContent.goBack();
        case 'toggleFullscreen':
            return toggleFullScreen()

        default:
            return send(arg.type)
    }
}


window.addEventListener('DOMContentLoaded', function(e) {
    let addZoom = i => {
        _webContent.setZoomFactor(i + _webContent.getZoomFactor())
    }
    window.addEventListener('wheel', (ev) => {
        if (ev.ctrlKey) {
            addZoom(ev.deltaY > 0 ? -0.1 : 0.1)
        }
    })
    window.addEventListener('keydown', (ev) => {
        let key = ev.key.toLowerCase()
        switch (key) {
            case 'arrowup':
                return ev.altKey && ev.ctrlKey && ipc_send('prevSite');
            case 'arrowdown':
                return ev.altKey && ev.ctrlKey && ipc_send('nextSite');
            case 'w':
                return ev.ctrlKey && ipc_send('closeTab');
            case 'f1':
                return ipc_send('markURL')
            case 'f11':
                return ipc_send('toggleFullscreen');
            case 'browserback':
                return ipc_send('back');
            case 'arrowleft':
                return ev.shiftKey && !isInputFocused() && ipc_send('back');
            case 'browserforward':
                return ipc_send('forward');
            case 'arrowright':
                return ev.shiftKey && !isInputFocused() && ipc_send('forward');
            case 'f12':
                return _webContent.toggleDevTools()
            case 'f5':
                return location.reload();
        }
    })
});

function send(channel, args) {
    ipcRenderer.sendToHost(channel, args)
}

function ipc_send(type, data) {
    data = { data: data };
    data = Object.assign({
        type: type
    }, typeof(data) == 'object' ? data : { msg: data });
    doAction(data);
    //ipcRenderer.sendSync('msg',data); 
}

function isInputFocused() {
    return document.activeElement.nodeName != 'BODY'
}

function toggleFullScreen() {
    if (!document.fullscreenElement && // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        $(window).resize();
        return true;
    }
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
    $(window).resize();
    return false;
}