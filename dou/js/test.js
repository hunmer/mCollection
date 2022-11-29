const https = require('https');  // 引入内置http模块

let api_url = 'https://dps.kdlapi.com/api/getdps?secret_id=ogah99eerlduvb4fygo8&signature=fniesj82ggwyp0tk04rcdu5q04skifm3&num=1';  // 要访问的目标网页

// 采用gzip压缩, 使速度更快
let options = {
    "headers" : {
        "Accept-Encoding": "gzip"
    }
};

// 发起请求
https.get(api_url, options, (res) => {

    // 若有gzip压缩, 则解压缩再输出
    if (res.headers['content-encoding'] && res.headers['content-encoding'].indexOf('gzip') != -1) {
        console.log('gzip')
        let zlib = require('zlib');
        let gunzipStream = zlib.createGunzip();
        res.pipe(gunzipStream).pipe(process.stdout);
    } else {
        // 无gzip压缩，直接输出
        res.pipe(process.stdout);
    }

}).on("error", (err) => {
    // 错误处理
    console.log("Error: " + err.message);
})

// https://dps.kdlapi.com/api/getdpsvalidtime