g_detailTabs.register('rule', {
    onTabChanged: old => {

    },
    onVideoEvent: (type, { tab }) => {
        if (type == 'show') {

        }
    },
    tab: {
        id: 'rule',
        title: '<i class="ti ti-search fs-2"></i>',
        html: `
            <div class="overflow-y-auto h-full" style="padding-bottom: 50px;" id="rule">
               
            </div>
            `
    },
}, {
    init() {
        const self = this
        g_action.registerAction({

        })
        loadRes(['js/rule/rule.js'], () => {
            
        })
    },
})