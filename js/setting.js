$(function() {
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
        oneTab: b => {
            $('.tab_nav').toggleClass('hide', b)
            if (b) {
                g_datalist.tabs.tab_tabs().forEach((tab, i) => {
                    if (i > 0) g_datalist.tabs.tab_remove(tab)
                })
            }
        },
        savePath: path => {
            $('#input_savePath').val(path)
        }
    })

    g_setting.tabs = {
        general: {
            title: '常规',
            icon: 'home',
            elements: {
                oneTab: {
                    title: '单标签',
                    type: 'switch',
                    value: () => getConfig('oneTab', false),
                },
                  hideAfterDraged: {
                    title: '拖动片段自动隐藏窗口',
                    type: 'switch',
                    value: () => getConfig('hideAfterDraged', false),
                },
               
            }
        },
        folders: {
            title: '同步',
            icon: 'folders',
            elements: {
                syncPaths: {
                    title: '同步目录, ||分离',
                    type: 'textarea',
                    rows: 5,
                    value: () => getConfig('savePath'),
                },
            }
        },
        user: {
            title: '用户',
            icon: 'user',
            elements: {
                 username: {
                    title: '用户名',
                    value: () => getConfig('username', ''),
                },
               
            }
        },
        download: {
            title: '下载',
            icon: 'download',
            elements: {

            }
        },

        library: {
            title: '素材库',
            icon: 'box',
            elements: {
                // TODO 全局导入设置
                importType: {
                    title: '导入方式',
                    require: true,
                    type: 'select',
                    list: { copy: '复制', move: '移动', link: '链接' },
                    value: () => getConfig(g_db.current + '_importType', 'copy'),
                },
                library_pwd: {
                    title: '素材库权限密码',
                    value: () => getConfig('library_pwd'),
                }
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
    g_setting.getConfig('oneTab') && g_setting.call('oneTab', true)
    // g_action.do(null, 'settings,general')
});