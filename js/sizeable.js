g_sizeable.init({
    saveData: (name, data) => local_saveJson(name, data),
    getData: (name, def) => local_readJson(name, def || {}),
})

// g_sizeable.register('detailTabs', {
//     selector: '#sidebar_right',
//     memory: true,
//     allow: ['left'],
//     width_min: 300,
//     width_max: 800,
//     style: {
//     	backgroundColor: 'unset',
//     },
// })
