
(function() {
    const self = this


    $(window).on('blur', e => {
        g_action.do(null, 'item_unpreview')
    }).on('click', function(e) {
        let time = new Date().getTime()
        if (e.target == self.lastClickEle) { // 同一元素点击（因为这个是绑在window的，根据div层级可能一次触发很多次）
            if (time - self.lastClick <= 400 && g_datalist.ds && g_datalist.ds.getSelection().length) {
                g_datalist.ds.clearSelection()
                g_item.selected_clear()
                clearEventBubble(e)
                return false
            } // 双击
        }
        self.lastClickEle = e.target
        self.lastClick = time
    })
    
})();