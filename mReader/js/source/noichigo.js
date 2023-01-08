 g_source.list.noichigo = {
     parseLink(link) {
         // let d = urlMatchs(link, 'https://www.no-ichigo.jp/book/{id}/{page}')

         if (link.indexOf('no-ichigo.jp/') !== -1) {
             link += '/'
             let id = cutString(link, '/book_id/', '/')
             if (id != '') return { type: 'book', id }
             id = cutString(link, '/book/n', '/')
             if (id != '') return { type: 'book', id }
         }
     },
     search(opts, cb) {
         let { page, keyword } = opts
         fetch1(`https://www.no-ichigo.jp/search/book/${page}?word=${keyword}&search_targets%5B0%5D=1&search_targets%5B1%5D=2&search_targets%5B2%5D=4&genre=0&feeling=0&finished=0`, 'text').then(body => {
             body = $(body)
             let ret = [];
             for (let el of body.find('.linkGroup')) {
                 el = $(el)
                 let meta = el.find('.tag').parent()
                 ret.push({
                     link: el.find('a').attr('href'),
                     cover: el.find('img')[0].src.trim(),
                     title: el.find('.title a').text().trim(),
                     author: el.find('.name').text().trim(),
                     category: meta.find('.tag').remove().text().trim(),
                     pages: parseInt(meta.text()),
                     finished: el.find('.icnEnd').length > 0,
                 })
             }
             cb(ret)
         })
     },
     nextPage(opts, cb) {
         if (!opts) opts = g_source.current
         let { page, id } = opts

         this.getPage({ start: page, end: page + 5, id }, data => {
             if (data.status !== 0) {
                 data.errMsg = '获取失败'
             } else {
                 opts.page = page + data.data.pages.length
             }
             cb(data)
         })
     },
     getPage(d, cb) {
         fetch1(`https://www.no-ichigo.jp/book/n${d.id}/pages/${d.start+'-'+d.end}`, 'json').then(cb)
     },

     getDetail(d, cb) {
         switch (d.type) {
             case 'book':
                 fetch1('https://www.no-ichigo.jp/read/book/book_id/' + d.id, 'text').then(body => {
                     body = $(body)
                     let [author, category, pages, meta] = body.find('.bookDetail p').text().split('\n').map(s => s.trim()).filter(s => s != '')
                     let tags = []
                     for (let el of body.find('.keywordBtn a')) tags.push(el.outerText)

                     let chapters = {}
                     let dd = body.find('.chapterLink dd')
                     if (!dd.length) dd = body.find('.chapterLink dt') // 没有小章节
                     for (let el of dd) chapters[el.querySelector('a').href] = {
                         title: el.outerText,
                     }

                     cb({
                         title: body.find('.bookDetail h2').text(),
                         cover: 'https://www.no-ichigo.jp' + body.find('.bookImg img').attr('src'),
                         desc: body.find('#content-maincol p').text(),
                         finished: pages.indexOf(' 完') != -1,
                         tags,
                         author,
                         category,
                         chapters,
                         pages: parseInt(pages.split(' ')[0]),
                         meta
                     })
                 })
                 break;
         }
     },

 }