$(function() {
    //   g_folder.folder_add({
    //     id: 1,
    //     title: 'folder1',
    //     icon: 'folder',
    //     desc: 'this is folder1',
    // })
    // g_detail.showList(['2d3706069a58c5dc87fdc308cb9b145b'])
     g_plugin.registerEvent('db_connected', ({ opts }) => {
        if (opts.type === DB_TYPE_DEFAULT) {
            test_showAll()
        }
    })
    return
    g_data.data_import({
        "43d333f2abca4510c0c1f267948bf5fe": {
            "link": "",
            "title": "1667533510939.mp4",
            "birthtime": 1679673959405,
            "size": 699775,
            "deleted": 0,
            "json": {
                // "duration": 3,
                // "width": 1920,
                // "height": 1080,
                // "frame": "30/1"
            },
            "date": 1679720777860,
            "file": "G://aa//a//1667533510939.mp4",
            "md5": "43d333f2abca4510c0c1f267948bf5fe",

             url: 'https://www.baidu.com',
            desc: 'test',

            score: 3,
        }
    })
});

var test_showList = () => g_detail.showList(['2d3706069a58c5dc87fdc308cb9b145b'])
var test_showAll = () => doAction('category,all')