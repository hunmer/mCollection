$(function() {
    g_setting.default = {

    }

    g_action.registerAction({
        setting_setSavePath: dom => {
            g_pp.set('savePath', path => $('#input_savePath').val(path[0]));
            ipc_send('fileDialog', {
                id: 'savePath',
                title: '选中目录',
                properties: ['openDirectory'],
            })
        },
    })

    g_setting.onSetConfig({
        savePath: path => {
            $('#input_savePath').val(path)
        }
    })

    g_setting.tabs = {
        general: {
            title: '常规',
            icon: 'home',
            elements: {
                notif: {
                    title: '完成提示音',
                    type: 'switch',
                    value: getConfig('notif', false),
                },
            }
        },
        folders: {
            title: '同步文件夹',
            icon: 'folders',
            elements: {
                syncPaths: {
                    title: '同步目录, ||分离',
                    type: 'textarea',
                    rows: 5,
                    value: getConfig('savePath'),
                },
            }
        },

        download: {
            title: '下载',
            icon: 'download',
            elements: {

            }
        },

        about: {
            title: '关于',
            icon: 'coffee',
            elements: {

            }
        },
    }
    g_setting.getConfig('darkMode') && g_setting.call('darkMode', true)
    g_setting.getConfig('notif') && g_setting.call('notif', true)
    // g_action.do(null, 'settings,general')
});