g_sizeable.init({
    saveData: (name, data) => local_saveJson(name, data),
    getData: (name, def) => local_readJson(name, def || {}),
})
g_sizeable.register('sidebar_left', {
    selector: '#sidebar_left',
    memory: true,
    allow: ['right'],
    width_min: 200,
    width_max: 500,
     style: {
    	backgroundColor: 'unset',
    },
    change: (t, i) => {
        if (t == 'width') { // 调整宽度
            // 设置css变量就OK
            setCssVar('--offset-left', i + 'px')
            return { resize: false }
        }
    }
})

g_sizeable.register('sidebar_right', {
    selector: '#sidebar_right',
    memory: true,
    allow: ['left'],
    width_min: 200,
    width_max: 700,
    style: {
    	backgroundColor: 'unset',
    },
    change: (t, i) => {
        if (t == 'width') { // 调整宽度
            // 设置css变量就OK
            setCssVar('--offset-right', i + 'px')
            return { resize: false }
        }
    }
})