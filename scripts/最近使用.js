// ==UserScript==
// @name    最近使用
// @version    1.0
// @author    hunmer
// @icon      history
// @description    增加最近使用到侧边栏（拖动文件日期)
// @updateURL   https://neysummer2000.fun/mCollection/scripts/最近使用.js
// @namespace    b8011727-38f9-4ba0-8e78-c62d27271b7e

// ==/UserScript==

({
    max: 100,
    save() {
        this.data = Object.fromEntries(Object.entries(this.data).splice(0 - this.max).sort((a, b) => b[1] - a[1]))
        local_saveJson(this.key+'_recent', this.data)
    },
    init() {
        const self = this
        self.key = g_db.current
        self.data = local_readJson(self.key+'_recent', {})
        g_plugin.registerEvent('beforeDragingFile', ({ keys }) => {
            let now = new Date().getTime()
            keys.forEach(md5 => self.data[md5] = now)
            self.save()
            g_rule.refresh('history')
        })

        g_plugin.registerEvent('db_connected', () => {
            g_rule.register('history', {
                title: '最近使用',
                sqlite: {
                    async all() {
                        return new Promise(reslove => {
                            Promise.all(Object.keys(self.data).map(async md5 => {
                                return { id: await g_data.data_getID(md5), md5 }
                            })).then(reslove)
                        })
                    }
                },
                sidebar: {
                    title: `最近使用<span class="badge badge-outline text-blue ms-2" data-ruleBadge="history">0</span>`,
                    icon: 'history',
                    action: 'category,history',
                },
            }, true)
        })
        
    }
}).init()
