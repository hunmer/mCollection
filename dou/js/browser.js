g_browser.init({
    openURL(url, group = 'default') {
        let opts = typeof(url) == 'object' ? url : { url }
        g_browser.tab_add(group, opts)
        g_account.account_load(group)
    }
})