var log4js = require('log4js');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function deploger() {
  EventEmitter.call(this);
}

util.inherits(deploger, EventEmitter);

module.exports = deploger;

var publish_logger, build_logger;
var errHandler = function(logger, data) {
  logger.fatal(data.msg);
  logger.info(data.err.message);
};

// 创建 log 文件，初始化 logger
deploger
  .on('before-deploy', function(data) {
    publish_logger = require('../logger')(path.join(data.log_dir, data.log_file), 'publish');
    publish_logger.trace('发布' + data.env + ' 环境中');

    build_logger = log4js.getLogger('build');
  })
  .on('mkdir-log-err', errHandler.bind(null, publish_logger))
  .on('touch-logfile-err', errHandler.bind(null, publish_logger))
  .on('clear-logfile-err', errHandler.bind(null, publish_logger))
  .on('before-build', function() {
    publish_logger.trace('正在预处理静态资源...');
  })
  .on('build-param-err', errHandler.bind(null, build_logger))
  .on('display-repos', function(data) {
    build_logger.info('项目 git repos 信息:');
    build_logger.info('repos name: ' + data.repos_name);
    build_logger.info('repos url: ' + data.repos_url);
    build_logger.info('commit id: ' + data.commit_id);
    build_logger.info('owner name: ' + data.owner_name);
  })
  .on('mk-out-dir-err', errHandler.bind(null, build_logger))
  .on('after-mk-out-dir', function(outdir) {
    build_logger.info('创建预处理目录成功: ' + outdir);
    build_logger.trace('正在下载项目源码...');
  })
  .on('curl-repos-err', errHandler.bind(null, build_logger))
  .on('after-curl-repos', function(output, tar_gz_url, outfile) {
    build_logger.info(output);
    build_logger.info('下载' + tar_gz_url + '源码成功');
    build_logger.trace('正在解压' + outfile);
  })
  .on('unzip-repos-err', errHandler.bind(null, build_logger))
  .on('after-unzip-repos', function(output, outdir, outfile) {
    build_logger.info(output);
    build_logger.info('解压' + outfile + '完成');
    build_logger.trace('进入目录' + outdir);
    build_logger.trace('正在编译...');
  })
  .on('npm-prestart-err', errHandler.bind(null, build_logger))
  .on('after-npm-prestart', function(output, outfile) {
    build_logger.info(output);
    build_logger.info('编译成功');
    build_logger.info('正在删除' + outfile + '...');
  })
  .on('rm-zip-err', errHandler.bind(null, build_logger))
  .on('after-rm-zip', function(outfile) {
    logger.info('删除' + outfile + '成功');
  })
  .on('build-err', errHandler.bind(null, build_logger))
  .on('after-build', function() {
    build_logger.info('预处理静态资源完成');
  })
;
