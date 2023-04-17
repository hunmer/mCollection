var g_theme = {
    list: {},
    init() {
        const self = g_theme
        g_setting.onSetConfig({
            theme: theme => self.switch(theme),
            bg: url => self.switch(this.current),
        })
        g_input.bind('theme_select', ({val}) => {
            // 临时预览主题
            self.switch(val)
        })
        const getColorList = () => {
            let list = {}
            Object.entries(self.list).forEach(([k, v]) => list[k] = v.palette.bg)
            return list
        }
        const onExit = save => {
            !save && self.switch(self.lastTheme)
            delete self.lastTheme
        }
        g_setting.tabs.theme = {
            title: '主题',
            icon: 'palette',
            onShow: () => self.lastTheme = self.current,
            onClose: () => onExit(),
            onHide: () => onExit(true),
            elements: {
                theme: {
                    title: '主题',
                    name: 'theme_select',
                    type: 'colorInputs',
                    list: getColorList,
                    value: () => getConfig('theme', ''),
                },
                disable_bg: {
                    title: '禁用背景',
                    type: 'switch',
                    value: () => getConfig('disable_bg', false),
                },
                bg: {
                    title: '自定义背景',
                    value: () => getConfig('bg'),
                    type: 'file_chooser',
                    opts: {
                        title: '选择背景图片',
                        properties: ['openFile'],
                        filters: [
                            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
                        ],
                    },
                }
            }
        }
        $(() => g_setting.apply(['theme']))
    },
    register(name, opts) {
        if (opts.style) {
            g_style.addStyle()
        }
        this.list[name] = Object.assign({
            classes: 'theme_'+name,
            style() {
                return _getStyle(this)
            }
        }, opts)
        return this
    },
    switch(name, enable = true) {
        if(name == undefined) return
        let current = this.current
        if (enable == undefined) enable = current != name
        if (current != undefined) {
            delete this.current
            this.switch(current, false)
        }
        let opts = this.list[name]
        let id = 'theme_' + name
        g_style.toggleStyle(id, opts.style(), enable)
        $('html').toggleClass(opts.classes, enable)
        this.current = name
    },
}
g_theme.init()

const _getStyle = self => {
    var bg = copyFn(self.bg)
    var palette = copyFn(self.palette)

    let img = getConfig('bg')
    if(bg && img && !getConfig('disable_bg')){
        bg.url ??= img
        Object.assign(palette, bg)
    }

    let i = '!important';
    ['text', 'bg', 'second', 'primary'].forEach(k => {
        let color = palette[k]
        if(color.split(',').length == 3){
            let opacity = palette[k+'_opacity'] || 1
            palette[k] = `rgba(${color},${opacity})`
        }
    })
    var {primary, second, bg, text, url, style} = palette
    return `

    ${url ? `
    body:not(.theme-dark) {
        margin: 0;
        padding: 0;
        background-image: url(${formatBackgroundURL(url)});
        background-size: 100% 100%;
        backdrop-filter: blur(1px);
    }
    ` : ''}

    :root {
        --tblr-muted: ${text} !important;
        --tblr-body-bg: ${bg} ${i};
        --tblr-body-bg-rgb: ${bg} ${i};
        --tblr-border-color: ${second} ${i};
        --tblr-body-color: ${text} ${i};
        --tblr-body-color-rgb: ${text} ${i};
        --tblr-card-bg: ${bg} ${i};
        --tblr-bg-surface: ${bg} ${i};
        --tblr-bg-surface-tertiary: ${bg} ${i};
        --tblr-bg-surface-secondary: ${second} ${i};
        --tblr-muted-rgb: ${primary} ${i};
        --tblr-link-hover-color: ${primary} ${i};
    }

    .list-group {
        --tblr-list-group-action-hover-color: ${primary} ${i};
    }

    .input-group-text, .btn-close, .nav-item a.active {
        color:  ${text} ${i};
        background-color: ${second} ${i};
    }

    .item_selected {
        border: 4px solid var(--tblr-primary) !important;
    }

    body, .modal-header {
        background-color: ${bg} ${i};
    }

    .form-colorinput-color {
        border-color: ${text} ${i};
    }

    .accordion {
        --tblr-accordion-bg: ${bg} ${i};
        --tblr-accordion-active-bg: ${second} ${i};
    }

    *:not(.badge, ^=.btn-ghost-) {
        color: ${text} ${i};
    }
    ` + (toVal(style, palette) || '')
}

// 本地文件转FILE://
function formatBackgroundURL(img) {
    if (!img.startsWith('.')) img = 'file:\\' + img
    return replaceAll_once(img, '\\', '\\\\').replaceAll('#', '%23').replaceAll(' ', '%20')
}

g_theme.register('dark', {
    palette: {
        primary: '#333333',
        second: '#52596e',
        bg: '#091c32',
        text: '#FFFFFF'
    },
})

g_theme.register('matte', {
    palette: {
        primary: '#3e60c1',
        second: '#2e4583',
        bg: '#293556',
        text: '#FFFFFF'
    },
})

g_theme.register('stormi', {
    palette: {
        primary: '#75bded',
        second: '#4a8db7',
        bg: '#3b7097',
        text: '#FFFFFF'
    },
 
})

g_theme.register('eagle', {
    palette: {
        primary: '#0072ef',
        second: '#2a2b2f',
        bg: '#353639',
        text: '#FFFFFF'
    },
})

g_theme.register('dark1', {
    palette: {
        primary: '#3e90ef',
        second: '#333438',
        bg: '#141718',
        text: '#FFFFFF'
    },
})


g_theme.register('dark2', {
    palette: {
        primary: '239, 217, 180',
        second: '77, 97, 96',
        bg: '41, 37, 34',
        text: '255, 255, 255'
    },
    bg: {
        text_opacity: 0.6,
        second_opacity: 0.6,
        bg_opacity: 0.3,
        style({text}){
            return `
                :root {
                    --tblr-btn-bg: unset !important;
                }
                .badge {
                    color: ${text} !important;
                }
                .modal {
                    --tblr-modal-bg: rgba(0, 0, 0, .6) !important;
                    background-color: rgba(0, 0, 0, .6) !important;
                }

                
                
            `
        }
    }
})

g_theme.register('white', {
    palette: {
        primary: '#3e90ef',
        second: '#DADADA',
        bg: '#E8E8E8',
        text: '#666666'
    },
    bg: {
        bg: '232, 232, 232',
        text: '#000',
        style: `
            
        `
    }
})

g_theme.register('green', {
    palette: {
        primary: '#3e90ef',
        second: '#A3E4D7',
        bg: '#D1F2EB',
        text: '#666666'
    },
})