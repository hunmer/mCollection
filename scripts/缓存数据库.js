// ==UserScript==
// @name        缓存数据库
// @namespace   b45da2f8-0b8b-44ee-9cb8-2db511c11ead
// @version     0.0.1
// @author      作者名称
// @description 注释说明
// @updateURL               
// @primary     1
// ==/UserScript==

g_db.getSaveTo = function(md5, path) {
    if (isEmpty(path)) path = this.opts.path;
   let url = `http://124.222.144.154:5244/d/aliyun/library/影视/files/${md5.substr(0, 2)}/${md5.substr(2, 2)}/${md5}/`;
   console.log(url);
    return url;
}