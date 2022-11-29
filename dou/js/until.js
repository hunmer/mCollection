 APP_VERSION = 'v0.0.1';
// const UPDATE_SCRIPT_URL = 'https://gitee.com/neysummer2000/VideoManager/raw/main/';
 g_localKey = 'dou_';

 function numToStr(n) {
    if (n > 10000) {
        return (n / 10000).toFixed(1) + 'w';
    }
    if (n > 1000) {
        return (n / 1000).toFixed(1) + 'k';
    }
    return n;
}

function getNow(){
    return new Date().getTime();
}

