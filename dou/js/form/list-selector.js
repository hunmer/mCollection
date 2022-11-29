

  prompt(folder = '') {
        return new Promise(reslove => {
            confirm(`
            <ol class="breadcrumb breadcrumb-arrows mt-1" id="folderList_parents"></ol>
            <div id="folderList_folders" class="mt-3">

            </div>
            `, {
                id: 'folderList',
                title: '选择目录',
                onShow: () => this.showFolder(folder)
            }).then(() => {
                reslove(Array.from($('#folderList_folders input[type="checkbox"]:checked').map((i, input) => input.value)))
            })
        })
    },