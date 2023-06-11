// ==UserScript==
// @name    alist
// @version    0.0.1
// @author    hunmer
// @description    支持打开alist云素材库
// @updateURL    
// @primary    1
// @namespace    d3a47786-4571-4e3c-a166-3429aeef122f

// ==/UserScript==


/* 

{
    "name": "翻书",
    "size": 0,
    "is_dir": true,
    "modified": "2022-10-22T12:19:06.181Z",
    "sign": "",
    "thumb": "",
    "type": 0,
    "raw_url": "",
    "readme": "",
    "provider": "AliyundriveOpen",
    "related": null
}

*/
var g_alist = {
    api: 'http://124.222.144.154:5244',
    
    init(){
        false && this.get("/aliyun/LIAOYANJIE/testFolder").then(console.log)
        1 && this.fs_list({
            path: "/aliyun/LIAOYANJIE/testFolder",
            page: 1,
        }).then(({code, data, message}) => {
            data.total
            data.content.forEach(({name, is_dir, thumb, size, modified}) => {
                if(is_dir){
                    // http://124.222.144.154:5244/d/aliyun/LIAOYANJIE/testFolder/folder1/1665838305356.mp4
                    
                }
            })
        })
    },

    fs_get(path){
        return this.http({
            url: '/api/fs/get',
            data: {path}
        })
    },

    fs_list(opts){
        return this.http({
            url: '/api/fs/list',
            data: {
                ...opts,
                per_page: 0,
                refresh: false
            }
        })
    },

    getHeaders(headers = {}){
        return Object.assign({
            password: '',
        }, headers)
    },

    http(opts) {
        return new Promise(async reslove => {
            let {url, type, data, headers} = opts
            type ??= 'POST',
            url = this.api+url
            
            if (type == 'GET') {
                url += '?' + Object.entries(data).map(([name, value]) => name + '=' + value).join('&')
            } else {
                data = JSON.stringify(data)
            }

            let http = {
                url, type, data,
                headers: this.getHeaders(headers),
                contentType: 'application/json;charset=utf-8',
                success: reslove,
                error: ({ responseJSON }) => reslove(responseJSON),
            }
            console.log(http)
            $.ajax(http);
        })
    }

}
g_alist.init()
