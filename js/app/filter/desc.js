g_filter.filter_set('desc', require('./js/app/filter/datalist_filter_text.js')({
    icon: 'message-2',
    name: 'desc',
    header: '注释过滤',
    desc: '注释',
    
    preUpdate1({ val, match, equal, reverse, sqlite }) {
        if (match != 'NOT') match = ''
        let table = 'desc_meta'

        sqlite.assignValue('args', {
            [this.name]: `INNER JOIN ${table} ON files.id = ${table}.fid `
        })
        if (equal == '=') {
            return {
                [this.name]: `${table}.desc ${match} ${reverse ? '!' : ''}= '${val}'`
            }
        }
        return arr_forEach(val.split('\n'), (keyword, i) => [this.name + '_' + i, `${table}.desc ${match} ${reverse ? 'NOT' : ''} ${equal} '%${keyword}%'`])
    }
}))