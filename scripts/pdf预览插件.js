// ==UserScript==
// @name    pdf预览插件
// @version    0.0.1
// @author    hunmer
// @description    支持预览pdf
// @updateURL    https://neysummer2000.fun/mCollection/scripts/pdf预览插件.js
// @primary    1
// @namespace    810c9466-1564-4b21-a24e-c5eb86747988

// ==/UserScript==

(() => {

let path = g_plugin.getSciptPath() + 'pdf预览插件\\'

// TODO 详细列表记录pdf的总页数
g_preview.register('pdf', {
    onFullPreview(ev) {
        ev.html = `
        <div class="row w-full h-full m-0">
            <webview id="pdf_viewer" src="" class="w-full h-full" contextIsolation="false" disablewebsecurity></webview>
        </div>`
        ev.cb = modal => {
            let url = 'file://'+fileToUrl(ev.file)
            let webview = $('#pdf_viewer')[0]
            // webview.addEventListener('dom-ready', function(e) {
            //     this.openDevTools()
            // })
            webview.src = path + 'web\\viewer.html?url='+url
        }
    }
})

})()

/*
g_preload.register('pdf', {
    list: ['js/plugins/pdfjs/pdf.min.js', 'js/plugins/pdfjs/pdf_viewer.min.css'],
    check: () => typeof (window['pdfjs-dist/build/pdf']) != 'undefined'
})
g_preload.check('pdf', async () => {
    var url = ev.file
    var pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/plugins/pdfjs/pdf.worker.min.js';

    var pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        scale = 4,
        canvas = $('#pdf-canvas')[0],
        ctx = canvas.getContext('2d');

    function renderPage(num) {
        pageRendering = true;
        pdfDoc.getPage(num).then(function (page) {
            var viewport = page.getViewport({ scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            var renderContext = {
                canvasContext: ctx,
                viewport
            };
            var renderTask = page.render(renderContext);

            renderTask.promise.then(function () {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        getEle({input: 'pdf_input_page'}).val(num);
    }

    function onPrevPage() {
        setPage(pageNum - 1)
    }

    function onNextPage() {
        setPage(pageNum + 1)
    }

    function setPage(page){
        page = Math.max(Math.min(page, pdfDoc.numPages), 1)
        pageNum = page
        if (pageRendering) {
            pageNumPending = page;
        } else {
            renderPage(page);
        }
    }

    pdfjsLib.getDocument(ev.file).promise.then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        $('#pdf_pages').text(pdfDoc.numPages);
        renderPage(pageNum);
    });

    g_action.registerAction({
        pdf_prevPage: onPrevPage,
        pdf_nextPage: onNextPage,
        pdf_input_page: dom => g_pp.setTimeout('pdf_setPage', () => setPage(parseInt(dom.value)), 700),
    })
})
*/