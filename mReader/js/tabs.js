
    g_tabs.init({
        saveData: (name, data) => local_saveJson('tabs_' + name, data),
        getData: name => local_readJson('tabs_' + name, {}),
    })