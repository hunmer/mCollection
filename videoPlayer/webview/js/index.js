g_plugin.registerEvent('tabShow', data => {
    let src = data.web[0].src
    let match = (
        src.includes('youtube.com') && src.includes('list=')
    )
    // https://www.youtube.com/playlist?list=PLGnjPtt6DJXQMs74FthKkVixou0dvVyUo
    getEle('web_parse').toggleClass('hide', !match)
}, 1);

g_action.registerAction({
    web_parse: () => {
        ipc_send('parseURL', {url: $('#input_url').val()})
    }
})

$(function() {
    let tabs = {
        main: {
            tab1: {
                url: 'https://www.youtube.com/playlist?list=PLGnjPtt6DJXQMs74FthKkVixou0dvVyUo',
                title: 'homepage',
            }
        }
    }
    g_tabs.data_set(tabs, false)
    g_tabs.group_bind($('group')[0])
});