g_sizeable.init({
    saveData: (name, data) => local_saveJson(name, data),
    getData: (name, def) => local_readJson(name, def || {}),
})

g_sizeable.register('extraTabs', {
    selector: '#extra_tabs',
    memory: true,
    allow: ['top'],
    height_min: 500,
    height_max: 800,
    style: {
        backgroundColor: 'unset',
    },
})
