g_sizeable.init({
    saveData: (name, data) => local_saveJson(name, data),
    getData: (name, def) => local_readJson(name, def || {}),
})


g_sizeable.register('screenBottom', {
    selector: '#screen_bottom',
    memory: true,
    allow: ['top'],
    height_min: 300,
    height_max: 600,
    style: {
        backgroundColor: 'unset',
    },
     change: (t, i) => {
        if (t == 'height') { // 调整高度
            setCssVar('--screen-bottom', i + 'px')
            return { resize: false }
        }
    }
})

g_sizeable.register('detailTabs', {
    selector: '#detail_tabs',
    memory: true,
    allow: ['left'],
    width_min: 300,
    width_max: 500,
    style: {
    	backgroundColor: 'unset',
    },
})

g_sizeable.register('episodeList', {
    selector: '#episode_list',
    memory: true,
    allow: ['right'],
    width_min: 150,
    width_max: 300,
    style: {
        backgroundColor: 'unset',
    },
})
