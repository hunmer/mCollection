$(function() {


    $(window).on('resize', function(e){
        for(let div of $('.h-screen')){
            div.style.height = this.innerHeight - div.offsetTop + 'px'
        }
    }).resize()

  

    
   

});