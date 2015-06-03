var log4js = require('log4js');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function deploger() {
  EventEmitter.call(this);
}

util.inherits(deploger, EventEmitter);

module.exports = deploger;

var publish_logger, build_logger;

// 创建 log 文件，初始化 logger
deploger
  .on('before-deploy', function(data) {
    mk_log(data.log_dir, data.log_file);

    publish_logger = require('../logger')(path.join(data.log_dir, data.log_file), 'publish');
    publish_logger.trace('发布' + data.env + ' 环境中');

    build_logger = log4js.getLogger('build');
  })
  .on('before-build', function() {
    publish_logger.info('正在预处理静态资源...');
  })
  .on('build-param-err', function(data) {
    build_logger.fatal(data.msg);
    build_logger.info(data.err.message);
  })

  ;

function mk_log(log_dir, log_file) {
  log_file = path.join(log_dir, log_file);

  var mkdir_log = shell.exec('mkdir -p ' + log_dir);
  if (mkdir_log.code !== 0) {
    deploger.emit('mkdir-log-err', {
      msg: '创建 log dir: ' + log_dir + '失败',
      err: new Error(mkdir_log.output)
    });

    res.status(200).json({
      data: '创建日志目录失败'
    });

    return;
  }

  var touch_logfile = shell.exec('touch ' + log_file);
  if (touch_logfile.code !== 0) {
    deploger.emit('touch-logfile-err', {
      msg: '创建 log file: ' + log_file + '失败',
      err: new Error(touch_logfile.output)
    });

    res.status(200).json({
      data: '创建日志文件失败'
    });

    return;
  }

  var clear_logfile = shell.exec('> ' + log_file);
  if (clear_logfile.code !== 0) {
    deploger.emit('clear-logfile-err', {
      msg: '清除 log file: ' + log_file + '失败',
      err: new Error(clear_logfile.output)
    });

    res.status(200).json({
      data: '清除日志文件失败'
    });

    return;
  }
}
