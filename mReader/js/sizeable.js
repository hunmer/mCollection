g_sizeable.init({
    saveData: (name, data) => local_saveJson(name, data),
    getData: (name, def) => local_readJson(name, def || {}),
})

