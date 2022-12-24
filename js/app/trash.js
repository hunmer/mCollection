    g_dropdown.register('menu_trash', {
        position: 'top-end',
        offsetLeft: 5,
        list: {
            clear: {
                title: '清空回收站',
                icon: 'trash',
                class: 'text-danger',
                action: 'trash_clear',
            }
        }
    })
    g_action.registerAction({
        menu_trash: dom => g_dropdown.show('menu_trash', dom),
        trash_clear: () => {
            confirm('你确定要删除吗？此操作不可逆!', {
                title: '清空回收站',
                type: 'danger'
            }).then(() => {
                g_datalist.tabs.tab_getTypes('system', 'trash').forEach(tab => {
                    g_datalist.tab_remove(tab)
                })
                g_data.run(`DELETE FROM videos WHERE deleted = 1;`).then(() => {
                      $('#badge_trash').html('0')
                    toast('成功清空回收站!', 'success')
                })
            })
        }
    })