/**
 * Created by Kane on 15/7/30.
 */
$(function() {
  var RepoMod = {
      init: function() {
        this.publishing = false;
        this.$publish_btns = $('[eid="publish-btn"]');

        this.$config_form = $('[eid="config-form"]');
        this.repo_id = $('[eid="repo_id"]').val();
        this.$env_id = $('[eid="env-id"]');
        this.$branch = $('[eid="branch"]');
        this.$progress = $('[eid="config-publish-progress"]');
        this.$config_btn = $('[eid="config-btn"]');

        this.bind_evt();
      },

      bind_evt: function() {
        var self = this;

        this.$publish_btns.on('click', function(e) {
          e.preventDefault();
          e.stopPropagation();

          var $progress = $(this).parents('li').find('[eid="progress"]');
          var env_id = $(this).attr('env_id');
          var branch = $(this).attr('branch');
          var env_name = $(this).attr('env_name');
          var env_alias = $(this).attr('env_alias');

          self.publish($progress, self.repo_id, env_id, branch, env_name);

          $progress.parent().removeClass('hidden');

          self.show_progress($progress, self.repo_id, branch, env_alias);
        });

        this.$config_form.on('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();

          var env_id = self.$env_id.val();
          var branch = self.$branch.val();
          var env_name = self.$env_id.find('option').not(function() {
            return !this.selected;
          }).text();

          self.publish(self.$progress, self.repo_id, env_id, branch, env_name);
        });
      },

      publish: function($progress, repo_id, env_id, branch, env_name) {
        if (this.publishing) {
          return;
        }

        this.publishing = true;

        var url = '/f2e/deployment/' + repo_id;
        var self = this;

        $.ajax({
          url: url,
          type: 'POST',
          dataType: 'json',
          data: {
            secret: RepoMod.secret,
            env_id: env_id,
            branch: branch
          },
          success: function() {
            self.publishing = false;
          },
          error: function(xhr) {
            $progress.text(JSON.parse(xhr.response).err);

            if (self.timer) {
              clearTimeout(self.timer);
            }

            self.publishing = false;
          }
        });
      },

      show_progress: function($progress, repo_id, branch, env_alias) {
        var self = this;

        var _get_progress = function () {
          var url = '/f2e/deployment/' + repo_id + '/progress';
          $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            data: {
              secret: RepoMod.secret,
              env: env_alias,
              branch: branch,
              _: Date.now()
            },
            success: function(res) {
              $progress.text(self.timer && res.fail ? '发布失败' : res.progress + '%');

              if (!self.publishing) {
                clearTimeout(self.timer);
                return;
              }

              self.timer = setTimeout(_get_progress, 3000);
            },
            error: function(res) {
              if (self.timer) {
                clearTimeout(self.timer);
              }
              self.publishing = false;
              alert('服务器发生错误: ' + res.msg);
            }
          });
        };

        _get_progress();
      },

      secret: 'yunhua@926'
  };

  RepoMod.init();
});
