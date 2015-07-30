/**
 * Created by Kane on 15/7/30.
 */
$(function() {
  var publishing = false;

  var $progress = $('[eid="progress"]');

  $('[eid="publish-btn"]').on('click', function(e) {
    e.preventDefault();

    if (publishing) {
      return;
    }

    publishing = true;
    var repo = $(this).attr('repo');
    var url = '/f2e/alpha/' + repo + '/progress';

    //$.ajax({
    //  url: '/f2e/alpha',
    //  type: 'POST',
    //  dataType: 'json',
    //  data: {
    //    secret: 'yunhua@926',
    //  }
    //});

    var timer = setTimeout(function() {
      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        data: {
          secret: 'yunhua@926'
        },
        success: function(res) {
          if (res.fail) {
            clearTimeout(timer);
            publishing = false;
            return $progress.text('发布失败');
          }

          $progress.text(res.progress + '%');

          if (res.progress === 100) {
            clearTimeout(timer);
            publishing = false;
          }
        },
        error: function(res) {
          clearTimeout(timer);
          publishing = false;
          alert('服务器发生错误: ' + res.msg);
        }
      });
    }, 1000);
  });
});