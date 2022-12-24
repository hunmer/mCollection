
 $(function() {
     $(window).on('focus', () => !$('.modaled').length && g_clipboard.call('focus'))
     $(document).on('mousewheel', '.scroll-x', function(e){
        this.scrollLeft += e.originalEvent.deltaY
     })

 });
 g_action.registerAction(['data_upload', 'data_sync'], (dom, action) => {
     showModal({
         type: 'prompt',
         title: '输入用户名名称',
         textarea: getConfig('lastUser', ''),
     }).then(name => {
         if (!isEmpty(name)) {
             setConfig('lastUser', name);
             let data = { user: name };
             if (action[0] == 'data_upload') data.data = JSON.stringify(data_getAll());

             $.ajax({
                     url: g_api + 'upload.php',
                     type: 'POST',
                     dataType: 'json',
                     data: data,
                 })
                 .done(function(data) {
                     if (action[0] == 'data_upload') return toast('上传成功', 'success');
                     importData(data);
                 })
                 .fail(function() {
                     toast(action[0] == 'data_upload' ? '上传失败' : '同步失败', 'danger');
                 })
         }
     })
 });