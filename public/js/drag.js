var g_drag = {
    init() {

    },

    list: {},
    register(name, opts) {
        this.list[name] = Object.assign({
            board: false,
        }, opts)
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
            e.dataTransfer.effectAllowed = "all";
            e.dataTransfer.types = ['test'];
            opts.onDragStart(e)
        }).
        on('dragend', opts.selector, function(e) {
            self.hide(name)
            opts.onDargEnd && opts.onDargEnd(e)
        }).

        on('drop', opts.target, function(e) {
            opts.onDrop(e.originalEvent)
        }).
        on('dragenter', opts.target, function(e) {
            e.preventDefault()
        }).
        on('dragover', opts.target, function(e) {
            if (opts.onUpdateTarget(e.target) !== false) {
                let div = self.getElement(name)
                if (!div.length && !isEmpty(opts.html)) div = $(`<div class="w-max h-max" id="_drag_${name}" style="z-index: 9999;position:fixed;pointer-events: none;">${opts.html}</div>`).appendTo('body')

                // 绘制边框
                if (opts.board) {
                    let { left, top, width, height } = e.target.getBoundingClientRect()
                    $('.darg_board').remove()
                    $(`<div class="darg_board" style="z-index: 1;position:absolute;border: 4px solid red;left: ${left}px;top: ${top}px; width: ${width}px; height: ${height}px"></div>`).appendTo('#_drag_' + name)
                }
            }
            e.preventDefault()

        })
    },

    getElement(name) {
        return $('#_drag_' + name)
    },

    hide(name) {
        this.getElement(name).remove()
    },

}
g_drag.init()