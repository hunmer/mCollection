g_filter.filter_set('link', require('./js/app/filter/datalist_filter_text.js')({
    icon: 'link',
    name: 'link',
    header: '网页来源过滤',
    desc: '链接',
    preUpdate1({ val, match, equal, reverse, sqlite, include }) {
        if (match != 'NOT') match = ''
        console.log(include)
        let table = 'url_meta'

        sqlite.assignValue('args', {
            [this.name]: `INNER JOIN ${table} ON files.id ${include}= ${table}.fid `
        })
        if (equal == '=') {
            return {
                [this.name]: `${table}.url ${match} ${reverse ? '!' : ''}= '${val}'`
            }
        }
        return arr_forEach(val.split('\n'), (keyword, i) => [this.name + '_' + i, `${table}.url ${match} ${reverse ? 'NOT' : ''} ${equal} '%${keyword}%'`])
    }
}))