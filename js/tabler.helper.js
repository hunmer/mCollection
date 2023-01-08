var g_tabler = {

    bind_all() {

    },
    init() {
        $(document).
        on('click', '.form-videocheck', function(e) {
            let input = this.querySelector('.form-videocheck-input')
            input.checked = !input.checked
            clearEventBubble(e)
        }).
        on('click', '[data-bs-dropdown]', function(e) {
            let dropdown = this.dataset.bsDropdown
            // data-bs-auto-close
            let rect = this.getBoundingClientRect()
            let div = $('#' + dropdown).find('.dropdown-menu')
            div.css({
                display: 'block',
                position: 'fixed',
                zIndex: 999,
                left: rect.x - div.width(),
                top: rect.top - (div.height() - rect.height) / 2,
            })
        })
        // $(this.bind_all());
        // .on('click', 'a[data-bs-toggle]', function(e){
        //     let action = this.dataset.action_toggle
        //     console.log(action)
        // })

        // let error = console.error
        // console.error = msg => alert(msg, { title: '错误', type: 'danger' })
    },

    build_badge(text, color = 'blue'){
        return `<span class="badge badge-outline m-1 text-${color}">${text}</span>`
    },

    build_accordion(opts, obj = true) {
        opts = Object.assign({
            onOpen: e => {},
            onClose: e => {},
            collapse_start: '',
            collapse_end: '',
            parent: true, // 选择后关闭其他
            emptyName: '默认分组',
            header: '',
        }, opts)

        let groups = {}
        opts.datas.every((item, i) => {
            if (!groups[item.group]) groups[item.group] = []
            groups[item.group].push(item)
            return true
        })
        let h = '';
        let i = 0
        let id = opts.id || new Date().getTime()
        for (let [group, items] of Object.entries(groups)) {
            let header = typeof(opts.header) == 'function' ? opts.header(group, items) : opts.header
            h += ` <div class="accordion-item" id="accordion-${id}-${group}">
                <h2 class="accordion-header">
                  <button tabindex="-1" data-collapse="${group}" class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}-${group}" aria-expanded="true">
                    ${header.replace('{index}', ++i).replace('{i}', groups[group].length).replace('{title}',_l(group) || opts.emptyName)}
                  </button>
                </h2>`
            for (let item of items) {
                h += `
                    <div id="collapse-${id}-${group}" class="accordion-collapse collapse ${opts.default === true || group == opts.default ? 'show' : ''}" ${opts.parent ? `data-bs-parent="#accordion-${id}"` : ''} ${item.prop || ''}>
                          <div class="accordion-body ${item.bodyClass} pt-0" >
                          ${opts.collapse_start}
                          ${item.html}
                          ${opts.collapse_end}
                          </div>
                    </div>
                    `
            }
            h += `</div>`
        }
        if (!obj) return h

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

    build_checkbox_list(d) {
        let h = ''
        let {keys, vals} = ObjMaps(d.list)
        keys.forEach((k, i) => {
            h += `
            <label class="form-check">
              <input class="form-check-input" type="checkbox" value="${k}" ${k == d.value ? 'checked' : ''}>
              <span class="form-check-label">${vals[i]}</span>
            </label>
            `
        })
        return `<div id="${d.id}">${h}</div>`
    },

    buildButtonGroup(list, classes = ''){
        let h = ''
        list.forEach(d => {
            h += `
            <a href="#" class="btn btn-icon" aria-label="Button" data-action="${d.action}" title="${d.title}">
                <i class="ti ti-${d.icon} fs-2"></i>
            </a>`
        })
        return `<div class="${classes} w-full btn-group" style="height: 35px;">${h}</div>`
    },

    buildDataGrid(list){
        let h = ''
        for (let v of list) {
            h += `
                <div class="d-flex p-1">
                    <span class="badge bg-${v.color}-lt">${v.title}</span>
                    <div class="flex-fill text-end">${v.value}</div>
                </div>
            `
        }
        return `
        <div class="rows align-items-center mt-2 w-full align-self-end">
            ${h}
        </div>`
    }
}

function ObjMaps(obj){
    let vals = Object.values(obj)
    let keys = Array.isArray(obj) ? [...vals] : Object.keys(obj)
    return {keys, vals}
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