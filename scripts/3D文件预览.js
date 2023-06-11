// ==UserScript==
// @name    3D文件预览
// @version    0.0.1
// @author    hunmer
// @description    obj, 3ds, stl, ply, gltf, glb, off, 3dm, fbx, dae, wrl, 3mf, ifc, brep, step, iges, fcstd, bim
// @updateURL    https://neysummer2000.fun/mCollection/scripts/3D文件预览.js
// @primary    1
// @namespace    2861aceb-56d9-47e3-8a30-21ab96eb558c

// ==/UserScript==
(() => {
    let path = g_plugin.getSciptPath() + '3D文件预览\\'
    let exts = ['obj', '3ds', 'stl', 'ply', 'gltf', 'glb', 'off', '3dm', 'fbx', 'dae', 'wrl', '3mf', 'ifc', 'brep', 'step', 'igs', 'fcstd', 'bim']
    g_format.data.category['3d_model'] = exts

    g_preview.register(exts, {
        onFullPreview(ev) {
            ev.html = `
                <div class="row w-full m-0" style="padding-bottom: 50px;height: calc(100vh - 50px)">
                    <webview id="3d_viewer" src="" class="w-full h-full" contextIsolation="false" disablewebsecurity></webview>
                </div>
            `
            ev.cb = modal => {
                let url = 'file://'+fileToUrl(ev.file)
                let webview = $('#3d_viewer')[0]
                // webview.addEventListener('dom-ready', function(e) {
                //     this.openDevTools()
                // })
                webview.src = path + 'index.html#model='+url
            }
        }
    })

    g_preload.register('3dviewer', {
        list: [path + 'o3dv.min.js'],
        check: () => typeof (OV) != 'undefined'
    })
    
    g_plugin.registerEvent('markCover', ({type, args, cb}) => {
        if(type == '3d_model'){
            let queue = g_queue.list['3d_model']
            if(!queue) queue = new Queue('3d_model', {
                max: 1,
                interval: 1000,
                timeout: 1000 * 3,
                title: '3D封面分析',
            })
            
            let {input, output} = args
            queue.add(input, {
                output,
                onStatusChange(status, taskCB, file) {
                    if (status != TASK_RUNNING) return

                    g_preload.check('3dviewer', () => {
                        try {
                            OV.SetExternalLibLocation( path+'libs\\');
                            importImageData(file, this.output).then(() => cb(this.output) & taskCB(TASK_COMPLETED))
                        } catch(err){
                            console.error(err + '->' + input)
                            taskCB(TASK_ERROR)
                        }
                    })
                }
            })

        }
    })
})()

function importImageData(input, saveTo){
    return new Promise(reslove => {
        let viewer = window._viewer = new OV.EmbeddedViewer(document.createElement('div'), {
            // camera: new OV.Camera(
            //     new OV.Coord3D(-1.5, 2.0, 3.0),
            //     new OV.Coord3D(0.0, 0.0, 0.0),
            //     new OV.Coord3D(0.0, 1.0, 0.0),
            //     45.0
            // ),
            backgroundColor: new OV.RGBAColor(255, 255, 255, 255),
            defaultColor: new OV.RGBColor(200, 200, 200),
            onModelLoaded(){
                let imgData = viewer.viewer.GetImageAsDataUrl(225, 225)
                !isEmpty(saveTo) && nodejs.files.write(saveTo, Buffer.from(imgData.replace(/^data:image\/\w+;base64,/, ""), 'base64'))
                reslove(imgData)
            }
        });
        viewer.LoadModelFromUrlList([input])
    })
   
}

