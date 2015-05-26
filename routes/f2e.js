var express = require('express');
var router = express.Router();
var logger = require('../logger')('publish');
var path = require('path');
var config = require('../config');
var f2e_build = require('../service/f2e-build');
var f2e_sync = require('../service/f2e-sync');
var qiniu_sync = require('../service/qiniu-sync');
var f2e_version = require('../service/f2e-version');

module.exports = router;

router.post('/alpha', function (req, res) {
  console.log('准备发布 alpha 环境...');

  var log = '';

  logger.info('正在预处理静态资源...');
  var build_rs = f2e_build(
    req.body,
    config.alpha_work_path
  );

  if (!build_rs) {
    logger.fatal('预处理静态资源失败');
    return res.status(200).json({
      code: 500,
      data: 'error on build'
    });
  }

  log += build_rs.log;

  logger.info('预处理静态资源完成');

  var pkg = require(path.resolve(build_rs.out_dir, './package.json'));
  var src = path.resolve(build_rs.out_dir, pkg.dest, './*');
  var dest_dir = path.resolve(config.static_server.alpha, pkg.name, pkg.version);

  logger.info('正在发布静态资源到服务器...');
  log += f2e_sync(src, dest_dir);
  logger.info('正在发布静态资源到七牛服务器...');

  try {
    log += qiniu_sync();
  } catch(e) {
    // 暂不做处理，因为七牛服务器不接受 html 文件，所以导致错误
    logger.error('上传静态资源到七牛服务器出错...');
    logger.error(e.message);
    console.log(e);
  }

  logger.info('静态资源发布成功');

  logger.info('正在更新版本数据库...');
  f2e_version(build_rs.repository.owner.username + '/' + build_rs.repository.name, pkg.version, build_rs.repository.url);

  logger.warn('other info:');
  logger.info(log);

  res.status(200).json({
    code: 200,
    data: log
  });
});
