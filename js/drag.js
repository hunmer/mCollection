var g_drag = {
    init() {

    },

    list: {},
    register(name, opts) {
        this.list[name] = opts
        this.bind(name)
        return this
    },
    get(name) {
        return this.list[name]
    },
    show(name) {},
    bind(name) {
        let self = this
        let opts = this.get(name)

        $(document).
        on('dragstart', opts.selector, e => {
            e = e.originalEvent
            // 设置图像？
            // var img = new Image();
            // img.src = './res/cover1.jpg';
            // e.dataTransfer.setDragImage(img, 10, 10);
            e.dataTransfer.effectAllowed = "move";
            opts.onDragStart(e)
        }).
        on('dragover', opts.selector, e => {
            let { target } = e
            let { left, top, width, height } = target.getBoundingClientRect()
            if (opts.onUpdateTarget(e) !== false) {
                let div = self.getElement(name)
                if (!div.length) div = $(`<div class="w-max h-max" id="_drag_${name}" style="z-index: 9999;position:fixed;pointer-events: none;">${opts.html}</div>`).appendTo('body')

                // 绘制边框
                $('.darg_board').remove()
                $(`<div class="darg_board" style="z-index: 1;position:absolute;border: 4px solid red;left: ${left}px;top: ${top}px; width: ${width}px; height: ${height}px"></div>`).appendTo('#_drag_' + name)
            }
        }).
        on('dragleave', opts.selector, e => {
            self.hide(name)
        }).
        on('dragenter', opts.selector, e => {
            e.preventDefault()
        }).
        on('dragover', opts.selector, e => {
            e.preventDefault()
        }).
        on('dragend', opts.selector, function(e) {
            self.hide(name)
        }).
        on('drop', opts.selector, function(e) {
            opts.onDrop(e.originalEvent)
        })
    },

    getElement(name) {
        return $('#_drag_' + name)
    },

    hide(name){
        this.getElement(name).remove()
    },

}
g_drag.init()
