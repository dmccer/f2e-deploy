var path = require('path');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Deploger(file, category) {
  EventEmitter.call(this);

  this.logger = require('../logger')(file, category);
}

util.inherits(Deploger, EventEmitter);

Deploger.prototype.errHandler = function(data) {
  this.logger.fatal(data.msg);
  this.logger.info(data.err.message);
}

module.exports = Deploger;

// 创建 log 文件，初始化 logger
// deploger
//   .on('before-deploy', function(data) {
//     publish_logger = require('../logger')(path.join(data.log_dir, data.log_file), 'publish');
//     publish_logger.trace('发布' + data.env + ' 环境中');
//
//     build_logger = log4js.getLogger('build');
//   })
//   .on('mkdir-log-err', errHandler.bind(null, logger))
//   .on('touch-logfile-err', errHandler.bind(null, logger))
//   .on('clear-logfile-err', errHandler.bind(null, logger))
// ;
