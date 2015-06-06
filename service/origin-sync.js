var path = require('path');
var shell = require('shelljs');
var config = require('../config');

module.exports = function(deploger, pkg, built) {
  sync_log_listener(deploger);

  // 项目 build 之后的文件位置
  var src = path.resolve(built.out_dir, pkg.dest, './*');
  // 静态资源服务器的目录(含资源版本)
  var dest_dir = path.resolve(config.static_server.alpha, built.repository.owner.username, pkg.name, pkg.version);

  var mk_dest_dir = shell.exec('sudo mkdir -p ' + dest_dir);
  if (mk_dest_dir.code !== 0) {
    err_msg = '创建静态服务器目录' + dest_dir + '失败';
    err = new Error(err_msg);

    deploger.emit('mk-dest-dir-err', {
      msg: err_msg,
      err: new Error(mk_dest_dir)
    });

    throw err;
  }

  var sync_src = shell.exec([
    'sudo cp -rf',
    src,
    dest_dir
  ].join(' '));
  if (sync_src.code !== 0) {
    err_msg = '拷贝待发布代码到静态服务器目录失败';
    err = new Error(err_msg);

    deploger.emit('copy-src-err', {
      msg: err_msg,
      err: new Error(sync_src.output)
    });

    throw err;
  }

  return true
};


function sync_log_listener(deploger) {
  var logger = deploger.logger;
  var errHandler = deploger.errHandler;

  deploger
    .on('before-origin-sync', function() {
      logger.trace('正在发布静态资源到服务器...');
    })
    .on('mk-dest-dir-err', errHandler)
    .on('copy-src-err', errHandler)

}
