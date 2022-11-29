$(function() {


    $(window)
    .on('blur', function(e){
        getConfig('blurPause') && g_episode.getPlayer().tryPause(false)
    })
    .on('focus', function(e){
        getConfig('blurPause') && g_episode.getPlayer().tryPlay(true)
    })
    .on('resize', function(e){
        for(let div of $('.h-screen')){
            div.style.height = this.innerHeight - div.offsetTop + 'px'
        }
    }).resize()


});