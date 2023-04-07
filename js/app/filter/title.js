g_filter.filter_set('title', require('./js/app/filter/datalist_filter_text.js')({
    icon: 'file',
    name: 'title',
    header: '文件名过滤',
    desc: '文件名',
    preUpdate1({ val, match, equal, reverse, sqlite }) {
        if (match != 'NOT') match = ''
        if (equal == '=') {
            
            return {
                [this.name]: `files.title ${match} ${reverse ? '!' : ''}= '${val}'`
            }
        }
        return arr_forEach(val.split('\n'), (keyword, i) => [this.name + '_' + i, `files.title ${match} ${reverse ? 'NOT' : ''} ${equal} '%${keyword}%'`])
    }
}))