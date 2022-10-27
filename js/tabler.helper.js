var g_tabler = {

    bind_all() {
        
    },
    init() {
        $(document).
        on('click', '.form-videocheck', function(e){
            let input = this.querySelector('.form-videocheck-input')
            input.checked = !input.checked
            clearEventBubble(e)
        }).
        on('click', '[data-bs-dropdown]', function(e){
            let dropdown = this.dataset.bsDropdown
            // data-bs-auto-close
            let rect = this.getBoundingClientRect()
            let div = $('#'+dropdown).find('.dropdown-menu')
            div.css({
                display: 'block',
                position: 'fixed',
                zIndex: 999,
                left: rect.x - div.width(),
                top:  rect.top - (div.height() - rect.height) / 2,
            })
        })
        // $(this.bind_all());
        // .on('click', 'a[data-bs-toggle]', function(e){
        //     let action = this.dataset.action_toggle
        //     console.log(action)
        // })

        let error = console.error
        console.error = msg => alert(msg, {title: '错误', type: 'danger'})
    },

    build_accordion(opts) {
        let groups = {}
        opts = Object.assign({
            onOpen: e => {},
            onClose: e => {},
            collapse_start: '',
            collapse_end: '',
            parent: true, // 选择后关闭其他
            emptyName: '默认分组',
            header: '',
        }, opts)
        opts.datas.every((item, i) => {
            if (!groups[item.group]) groups[item.group] = []
            groups[item.group].push(i)
            return true
        })
        let h = '';
        let id = opts.id || new Date().getTime()
        for (let group in groups) {
            h += `
                  <div class="accordion-item" id="accordion-${id}-${group}">
                    <h2 class="accordion-header">
                      <button data-collapse="${group}" class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}-${group}" aria-expanded="true">
                        ${opts.header.replace('{i}', groups[group].length) || _l(group) || opts.emptyName}
                      </button>
                    </h2>

                    <div id="collapse-${id}-${group}" class="accordion-collapse collapse ${opts.default === true || group == opts.default ? 'show' : ''}" ${opts.parent ? `data-bs-parent="#accordion-${id}"` : ''}>
                          <div class="accordion-body pt-0" >
                          ${opts.collapse_start}
            `
            for (let index of groups[group]) {
                h += this.parseItem(opts.datas[index])
            }
            h += `${opts.collapse_end}
                          </div>
                    </div>
                  </div>`
        }

        let div = $(`<div class="accordion" id="accordion-${id}">` + h + '</div>')
        div.find('[data-bs-toggle="collapse"]').on('click', function(e) {
            if (this.classList.contains('collapsed')) { // 关闭
                opts.onClose.call(this, e)
            } else {
                opts.onOpen.call(this, e)
            }
        })
        return div
    },

    parseItem(item){
        if(item.html) return item.html
        if(item.icon){
            
        }
    }
}

g_tabler.init();
// $('#sidebar_left').html(
//     g_tabler.build_accordion({
//         datas: [{
//             html: 'a',
//             group: 'group-a',
//         }, {
//             html: 'b',
//             group: 'group-b',
//         }, {
//             html: 'c',
//             group: 'group-a',
//         }]
//     })
// )