// ==UserScript==
// @name    媒体标注
// @version    0.0.1
// @author    hunmer
// @icon      bookmark:primary
// @description    为视频添加字幕支持
// @updateURL    https://neysummer2000.fun/mCollection/scripts/媒体标注.js
// @primary    99
// @namespace    917c600c-f42f-4e31-a821-e2b13255e28c

// ==/UserScript==

({
    init() {

        g_preload.register('mce', {
            list: ['../public/plugins/tinymce/tinymce.min.js'],
            check: () => typeof (tinyMCE) != 'undefined'
        })

        g_plugin.registerEvent('db_connected', () => {
            this.note_path = g_db.opts.path + '/note/'
        })

        g_item.setItemType('note', {
            initFile: args => args.note = this.note_path + args.data.md5 + '.html',
            // initFile: args => args.note = 'default.note',
            getFile: args => args.note,
            beforeCheck: () => { },
        })

        g_plugin.registerEvent('item_unFullPreview', () => {
            if (this.ime) {
                this.ime.destroy()
                delete this.ime
            }
        })

        // 笔记搜索
        // g_search.tabs_register('note', {
        //     tab: {
        //         icon: 'list-numbers',
        //         title: '笔记',
        //         html: g_search.replaceHTML(`%search_bar%<div class="search_result list-group list-group-flush p-2"></div>`)
        //     },
        //     onSearch(s) {
        //         return new Promise(reslove => {
        //             g_pp.setTimeout('note_search', async () => {
        //                 let ret = []
        //                 if (!isEmpty(s)) {

        //                 }
        //                 reslove(ret)
        //             }, 700)
        //         })
        //     },
        //     async onParse(item) {
        //         let data = await g_data.data_get(item.md5)
        //         return g_datalist.item_parse({ data, view: 'list' })
        //     }
        // })

        const InitMce = async () => {
            $('#preview_tabs').replaceClass('col-md-', 'col-md-6')
            var ime
            let data = g_preview.previewing.data.data
            let saveTo = await g_item.item_getVal('note', data)
            let selector = '#tinymce-default'
            let lastContent = nodejs.files.read(saveTo, '')

            const autoSave = timer => g_pp.setTimeout('tinyime_autosave', () => {
                // TODO 如果将图片写进文件里？
                let content = ime.getContent()
                // TODO 确保每个文件已经保存到本地
                // if(content.indexOf('blob:file:///') != -1)
                if (content != lastContent) {
                    lastContent = content
                    tinymce.activeEditor.getBody().querySelectorAll('._screenshot').forEach(el => {
                        if(!el.querySelector('img')) el.remove() // 移除tinymce删除不能完全删除多级div的bug
                    })
                    nodejs.files.write(saveTo, content)
                }
            }, timer || 500)


            const currentAuthor = 'Admin';
            let options = {
                selector,
                height: '100%',
                branding: false,
                language: 'zh-Hans',
                menubar: 'edit insert format table',
                auto_focus: '#tinymce-default',
                placeholder: '记点什么吧...',
                plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'anchor',
                    'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'wordcount', 'tinycomments'
                ],
                forced_root_block : 'div',
                setup: editor => {
                    let video = g_preview.video
                    if (video.nodeName == 'VIDEO'){
                        editor.ui.registry.addIcon('camera', `<i class="ti ti-camera fs-2"></i>`); // 注册图标
                        const makeScreenShot = () => {
                            let time = getTime(video.currentTime)
                            getImgBase64(video, 720).then(img => {
                                editor.insertContent(`
                                    <div class="_screenshot" style="position: relative;display: inline-block; cursor: pointer;" data-time="${time}">
                                        <span style="position: absolute;
                                        right: 10px;
                                        top: 5px;
                                        background-color: lightcyan;
                                        border-radius: 5px;
                                        font-weight: bold;
                                        padding: 2px 5px;">${time}</span>
                                        <img src="${img}" width="200" title="${time}" />
                                    </div>
                                `)
                            })
                        }
    
                        editor.on('PreInit', e => {
                            editor.ui.registry.addButton('screenshot', {
                                icon: 'camera',
                                onAction: () => makeScreenShot()
                            })
                            editor.ui.registry.addMenuItem('screenshot', {
                                text: '截图',
                                onAction: () => makeScreenShot()
                            })
                        })
                    }

                    editor.on('Init', () => {
                        editor.setContent(lastContent)
                        editor.getBody().querySelectorAll('._screenshot').forEach(el => el.setAttribute('contenteditable', false));
                    })
                    .on('dblclick', ev => {
                        let target = ev.target
                        let time = getParentData(target, 'time')
                        if (!isEmpty(time)) g_preview.video.currentTime = toTime(time)
                    });
                },
                toolbar: 'undo redo | screenshot forecolor backcolor styles | bullist numlist addcomment showcomments',
                content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; -webkit-font-smoothing: antialiased; }',

                // 评论
                tinycomments_mode: 'embedded',
                tinycomments_author: currentAuthor,
                tinycomments_can_resolve: (req, done, fail) => {
                    const allowed = req.comments.length > 0 && req.comments[0].author === currentAuthor;
                    done({ canResolve: allowed });
                },

                // 图片上传
                image_title: true,
                automatic_uploads: true,
                file_picker_types: 'image',
                file_picker_callback: (cb, value, meta) => {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.addEventListener('load', () => {
                            const id = 'blobid' + (new Date()).getTime();
                            const blobCache = tinymce.activeEditor.editorUpload.blobCache;
                            const base64 = reader.result.split(',')[1];
                            const blobInfo = blobCache.create(id, file, base64);
                            blobCache.add(blobInfo);
                            cb(blobInfo.blobUri(), { title: file.name });
                        });
                        reader.readAsDataURL(file);
                    });
                    input.click();
                },
            }
            // TODO 适配暗色模式
            // if (localStorage.getItem("tablerTheme") === 'dark') {
            //     options.skin = 'oxide-dark';
            //     options.content_css = 'dark';
            // }
            tinyMCE.init(options).then(ret => {
                ime = this.ime = ret[0]
                .on('keydown', e => e.key == 'Backspace' && autoSave(100)) //快速删除
                .on('input', autoSave)
                .on('change', autoSave)
            })
        }

        g_preview.tabs_inst.note = {
            tab: {
                id: 'note',
                icon: 'edit',
                title: '笔记',
                html: `
                <div id="tinymce-default">
                    <div class="text-center d-block mt-3">
                        <div class="spinner-grow" role="status"></div>
                    </div>
                </div>`
            },
            onShow: () => {
                g_preload.check('mce', () => InitMce())
            },
            onHide() {
                $('#preview_tabs').replaceClass('col-md-', 'col-md-5')
            }
        }
    },
}).init()


