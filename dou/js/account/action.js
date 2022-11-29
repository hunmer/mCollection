(() => {
    const self = g_account
    g_ui.register('account', {
        container: '#main_content',
        html: `
            <div id="account_tabs">

            </div>
        `,
        onHide(hide) {
            if (!hide) {
                // g_setting.apply(['coll_groupBy'])
                // g_coll.refresh()
            }
        }
    })

    self.init_tabs()
    g_menu.registerMenu({
        name: 'account_item',
        selector: '[data-action="account_click"]',
        dataKey: d => getParentAttr(d, 'data-account'),
        items: [{
            icon: 'pencil',
            text: '编辑',
            action: 'account_item_edit'
        }, {
            icon: 'trash',
            text: '删除',
            class: 'text-danger',
            action: 'account_item_delete'
        }]
    });
    
    g_action.registerAction(['account_item_delete', 'account_item_edit'], (dom, action) => {
        let id = g_menu.key
        let d = self.get(id)
        switch (action[0]) {
            case 'account_item_edit':
                self.account_edit(id)
                break;
            case 'account_item_delete':
                confirm('确定删除账号 [' + d.title + '] 吗?', {
                    title: '删除账号',
                    type: 'danger'
                }).then(() => {
                    self.remove(id)
                })
                break;
        }
        g_menu.hideMenu('account_item')
    })

    g_action.registerAction({
        account_new() {
            self.account_edit()
        },
        account_click(dom) {
            self.account_load(getParentAttr(dom, 'data-account'))
        },
        account_clear() {
            confirm('你确定重置所有账号吗?', {
                title: '重置账号',
                type: 'danger'
            }).then(() => {
                self.reset()
            })
        }
    })

    Object.assign(self, {
        account_load(id) {
            g_ui.show('account')

            self.getIcon('', '.active').removeClass('active')
            let badge = self.getIcon(id).addClass('active').find('.badge')
            if(!badge.hasClass('bg-success')){
                // 初次激活
                g_browser.group_getTabs(id)[0].click()
            }
            badge.addClass('bg-success')
            self.getContent('', '.show1').removeClass('show1')
            self.getContent(id).addClass('show1')
            $('._content.active').removeClass('active')
            
           getEle({site: id}, '._content').addClass('active')
        },
        account_unload() {

        },
        account_edit(id) {
            let d = this.get(id) || {
                title: '',
                desc: '',
                icon: 'res/default.jpg',
                 uid: ''
            }
            g_form.confirm('account_edit', {
                elements: {
                    icon: {
                        title: '图标',
                        type: 'image',
                        value: d.icon,
                    },
                    uid: {
                        title: 'uid',
                        value: d.uid,
                        class: 'hide',
                    },
                    title: {
                        title: '名称',
                        value: d.title,
                    },
                    desc: {
                        title: '注释',
                        type: 'textarea',
                        rows: 3,
                        value: d.desc,
                    },
                },
            }, {
                id: 'account_edit',
                title: '编辑账号',
                btn_ok: '保存',
                extraButtons: [{
                    text: '抖音号',
                    class: 'btn-warning',
                    onClick: e => {
                        prompt('', { title: '输入抖音主页链接或者ID' }).then(s => {
                            if (!isEmpty(s)) {
                                g_api.douyin_parseUser(s, d => {
                                    let { icon, name: title, desc, sec_uid: uid} = d
                                   g_form.setElementVal('account_edit', {icon, title, desc, uid})
                                })
                            }
                        })
                        return false
                    },
                }],
                onBtnClick: (btn, modal) => {
                    if (btn.id == 'btn_ok') {
                        if (!id) id = new Date().getTime()
                        this.set(id, g_form.getVals('account_edit'))
                        toast('保存成功', 'success')
                    }
                }
            })
        }
    })

})()