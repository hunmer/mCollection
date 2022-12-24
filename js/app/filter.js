var g_filter = {
    list: {},
    //  order by date desc
    presets: {
         all: {
            title: '全部',
            rule: "WHERE deleted=0",
            onCntChange: i => $('#badge_all').html(i),
        },
        noFolder: {
            title: '未分类',
            rule: "WHERE deleted=0 AND folders=''",
            onCntChange: i => $('#badge_noFolder').html(i),
        },
        noTag: {
            title: '未分类',
            rule: "WHERE deleted=0 AND tags=''",
            onCntChange: i => $('#badge_noTag').html(i),
        },
         random: {
            title: '随机模式',
            rule: "WHERE deleted=0",
            sort: 'random',
        },
        // recent: {
        //     title: '最近使用',
        //     rule: "",
        //     onCntChange: i => $('#badge_recent').html(i),
        // },
        trash: {
            title: '垃圾箱',
            rule: "WHERE deleted=1",
            value: {type: 'system', value: 'trash'},
            onCntChange: i => $('#badge_trash').html(i),

        },
        folder: {
            value: s => {
                return {type: 'folder', value: s}
            },
            title: s => {
                let d = g_folder.folder_get(s)
                return `<i class='ti ti-${d.icon} me-1'></i>${d.title}`
            },
            rule: s => `WHERE deleted=0 AND folders LIKE '%||${s}||%'`,
        }
    },

    getPreset(name, parasm) {
        let d = this.presets[name]
        if (parasm != undefined) {
        	let r = {}
            for (let k in d) if (typeof(d[k]) == 'function') r[k] = d[k](parasm)
            return r
        }
        return d
    },
    init() {
        loadRes(['js/app/filter/tag.js', 'js/app/filter/folder.js', 'js/app/filter/color.js'], i => {
            // todo call event
            this.update({
                tag: {
                    selected: 'a_tag1',
                    type: 'all'
                },
                folder: {
                    selected: ['folder1', 'folder2'],
                    match: 'all'
                },
                color: {
                    selected: '#ae3ec9'
                }
            })
        })

    },
    instance: {}, // 接口
    // 注册过滤
    filter_set(k, opts, obj) {
        this.list[k] = opts
        this.instance[k] = obj
        if (obj && typeof(obj.init) == 'function') {
            obj.init() // 初始化
        }
    },
    opts: {},
    setOpts(k, v) {
        return setObjVal(this.opts, k, v)
    },

    getOpts(k, def) {
        return getObjVal(this.opts, k) || def
    },

    update(d) {
        g_filter.setOpts('filter', d)
        let h = ''
        let funs = []
        for (let [name, item] of Object.entries(this.list)) {
            h += `
				<div class="dropdown" id="dropdown_filter_${name}">
				  <button tabindex="-1" class="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside">
				    ${item.icon ? `<i class="me-1 ti ti-${item.icon}"></i>` : ''}${item.title}
				  </button>
				  <ul class="dropdown-menu">
				  	${item.html(d)}
				  </ul>
				</div>
			`
            funs.push(() => item.init(d))
        }
        $('#filters').html(h)
        for (let f of funs) f()
    }


}

g_filter.init()