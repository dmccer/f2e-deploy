/**
 * Created by Kane on 15/7/30.
 */
$(function() {
  var publishing = false;

  $('[eid="publish-btn"]').on('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    if (publishing) {
      return;
    }

    publishing = true;
    var $progress = $(this).parents('li').find('[eid="progress"]');
    var repo_id = $(this).attr('repo_id');
    var env_id = $(this).attr('env_id');
    var env_name = $(this).attr('env_name');
    var env_alias = $(this).attr('env_alias');
    var branch = $(this).attr('branch');
    var owner = $(this).attr('owner');
    var repo_name = $(this).attr('repo_name');


    var url = '/f2e/deployment/' + repo_id;
    var timer;

    $.ajax({
      url: url,
      type: 'POST',
      dataType: 'json',
      data: {
        secret: 'yunhua@926',
        env_id: env_id,
        branch: branch
      },
      success: function() {
        publishing = false;
      },
      error: function() {
        console.log(env_name, arguments);
        $progress.text(env_name + '环境发布失败');

        if (timer) {
          clearTimeout(timer);
        }

        publishing = false;
      }
    });

    $progress.parent().removeClass('hidden');

    function get_progress() {
      $.ajax({
        url: '/f2e/deployment/' + repo_id + '/progress',
        type: 'GET',
        dataType: 'json',
        data: {
          secret: 'yunhua@926',
          env: env_alias,
          branch: branch,
          _: Date.now()
        },
        success: function(res) {
          if (timer && res.fail) {
            clearTimeout(timer);
            publishing = false;
            return $progress.text('发布失败');
          }

          $progress.text(res.progress + '%');

          if (res.progress === 100) {
            clearTimeout(timer);
            publishing = false;
            return;
          }

          timer = setTimeout(get_progress, 3000);
        },
        error: function(res) {
          if (timer) {
            clearTimeout(timer);
          }
          publishing = false;
          alert('服务器发生错误: ' + res.msg);
        }
      });
    }

    get_progress();
  });
});