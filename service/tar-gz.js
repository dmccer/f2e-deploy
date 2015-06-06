var path = require('path');
var shell = require('shelljs');
var config = require('../config');

module.exports = function(deploger, built, pkg) {
  // 静态资源服务器的目录(含资源版本)
  var dest_dir = path.resolve(config.static_server.alpha, built.repository.owner.username, pkg.name, pkg.version);
  var err_msg, err;

  targz_log_listener(deploger);
  deploger.emit('before-generate-targz');

  // TODO
  // 优化：工作区压缩，然后上传到静态服务器
  // 进入静态服务器目录
  shell.cd(path.dirname(dest_dir));

  var tar_gz_tip_prefix = '生成静态资源压缩包' + path.resolve(dest_dir, pkg.version);
  var tar_gz = shell.exec('sudo tar -czvf ' + pkg.version + '.tar.gz ' + pkg.version);
  if (tar_gz.code !== 0) {
    err_msg = tar_gz_tip_prefix + '失败';
    err = new Error(err_msg);

    deploger.emit('tar-gz-err', {
      msg: err_msg,
      err: new Error(tar_gz.output)
    });

    throw err;
  }

  deploger.emit('after-tar-gz', tar_gz_tip_prefix + '成功');
};

function targz_log_listener(deploger) {
  var logger = deploger.logger;
  var errHandler = deploger.errHandler;

  deploger
    .on('before-generate-targz', function() {
      logger.info('正在生成静态资源压缩包...');
    })
    .on('tar-gz-err', errHandler)
    .on('after-tar-gz', function(msg) {
      logger.info(msg);
    })
  ;
}
