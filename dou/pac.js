let blocked      = ["ip138.com"];
let proxyServer  = "PROXY 127.0.0.1:4780; SOCKS5 127.0.0.1:4780;";
function FindProxyForURL(url, host) {
    let shost = host.split(".").reverse();
    shost = shost[1] + "." + shost[0];
    for(let i = 0; i < blocked.length; i++) {
        if( shost == blocked[i] ) return proxyServer;
    }
    return "DIRECT";
}