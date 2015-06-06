var path = require('path');
var shell = require('shelljs');
var config = require('../config');
var jf = require('jsonfile');

module.exports = function(deploger) {
  var err_msg, err;

  qiniu_log_listener(deploger);
  deploger.emit('before-qiniu-sync');

  try {
    var qconf_json = jf.readFileSync(config.qiniu);
    qconf_json.src = config.static_server.alpha;
    jf.writeFileSync(config.qiniu, qconf_json);
  } catch(e) {
    err_msg = '更新七牛配置文件' + config.qiniu + '失败';
    err = new Error(err_msg);

    deploger.emit('update-qiniu-config-err', {
      msg: err_msg,
      err: err
    });

    throw err;
  }

  var qrsync = shell.exec('qrsync ' + config.qiniu);
  if (qrsync.code !== 0) {
    err_msg = '同步静态项目到七牛服务器失败';
    err = new Error(err_msg);

    deploger.emit('qrsync-err', {
      msg: err_msg,
      err: new Error(qrsync.output)
    });

    throw err;
  }

  return true;
};

function qiniu_log_listener(deploger) {
  var logger = deploger.logger;
  var errHandler = deploger.errHandler;

  deploger
    .on('before-qiniu-sync', function() {
      logger.info('正在发布静态资源到七牛服务器...');
    })
    .on('update-qiniu-config-err', errHandler)
    .on('qrsync-err', errHandler)
  ;
}
