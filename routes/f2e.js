var express = require('express');
var router = express.Router();
var path = require('path');
var shell = require('shelljs');
var config = require('../config');
var build = require('../service/build');
var origin_sync = require('../service/origin_sync');
var qiniu_sync = require('../service/qiniu-sync');
var version = require('../service/version');

module.exports = router;

router.get('/alpha/:name', function(req, res) {
  var logger = require('../logger')('log/down_gz.log', 'downgz');
  var owner = req.query.owner;
  var name = req.params.name;
  var repos_work_dir = path.resolve(config.alpha_work_path, owner, name);
  var deployed_dir = path.resolve(config.static_server.alpha, owner, name);

  if (!shell.test('-e', repos_work_dir)) {
    res.status(200).json({
      data: owner + '/' + name + '项目不存在或从未发布'
    });
  }

  var pkg = require(path.resolve(repos_work_dir, './package.json'));
  var filename = pkg.version + '.tar.gz';
  var fileurl = path.resolve(deployed_dir, filename);
  if (!shell.test('-f', fileurl)) {
    res.status(200).json({
      data: owner + '/' + name + '项目从未发布成功'
    });
  }

  res.download(fileurl, name + '-' + pkg.version + '.tar.gz', function(err) {
    if (err) {
      logger.error(fileurl + '下载失败');
      logger.info('错误信息如下： \n' + err.message);
      res.status(err.status).end();

      return;
    }

    logger.info(fileurl + '下载成功');
  });
});

router.post('/alpha', function (req, res) {
  var repos = req.body.repository;
  var log_dir = 'log/' + repos.owner.username;
  var log_file = log_dir + '/' + repos.name + '.log';
  shell.exec('mkdir -p ' + log_dir);
  shell.exec('touch ' + log_file);
  shell.exec('> ' + log_file);
  var logger = require('../logger')(log_file, 'publish');

  logger.info('准备发布 alpha 环境...');
  logger.info('正在预处理静态资源...');
  var build_rs = build(
    req.body,
    config.alpha_work_path
  );

  if (!build_rs) {
    logger.fatal('预处理静态资源失败');
    return res.status(200).json({
      code: 500,
      data: '预处理静态资源过程中发生错误'
    });
  }

  logger.info('预处理静态资源完成');

  var pkg = require(path.resolve(build_rs.out_dir, './package.json'));
  var src = path.resolve(build_rs.out_dir, pkg.dest, './*');
  var dest_dir = path.resolve(config.static_server.alpha, repos.owner.username, pkg.name, pkg.version);

  logger.info('正在发布静态资源到服务器...');
  var origin_sync_rs = origin_sync(src, dest_dir);
  if (origin_sync_rs.code !== 0) {
    logger.fatal('静态资源发布到服务器失败');
    logger.info('错误信息:\n' + origin_sync_rs.output);

    res.status(200).json({
      code: 500,
      data: '静态资源发布到服务器失败'
    });

    return;
  }

  logger.info('正在发布静态资源到七牛服务器...');

  try {
    var qiniu_sync_rs = qiniu_sync();

    if (qiniu_sync_rs.code !== 0) {
      logger.error('上传静态资源到七牛服务器出错...');
      logger.error('错误信息:\n' + qiniu_sync_rs.output);
    }
  } catch(e) {
    // 暂不做处理，因为七牛服务器不接受 html 文件，所以导致错误
    logger.info(e);
  }

  logger.info('静态资源发布成功');

  logger.info('正在生成静态资源压缩包...');
  // TODO
  // 优化：工作区压缩，然后上传到静态服务器

  // 进入静态服务器目录
  shell.cd(path.dirname(dest_dir));
  console.log(shell.pwd());

  var tar_gz = shell.exec('sudo tar -czvf ' + pkg.version + '.tar.gz ' + pkg.version);
  var tar_gz_tip_prefix = '生成静态资源压缩包' + path.resolve(dest_dir, pkg.version);

  if (tar_gz.code !== 0) {
    var err_tip = tar_gz_tip_prefix + '失败';

    logger.fatal(err_tip);
    logger.info('错误信息:\n' + tar_gz.output);

    res.status(200).json({
      code: 500,
      data: err_tip
    });

    return;
  }
  logger.info(tar_gz_tip_prefix + '成功');

  logger.info('正在更新版本数据库...');
  version({
    owner: build_rs.repository.owner.username,
    name: build_rs.repository.name,
    version: pkg.version,
    url: build_rs.repository.url
  }, function() {
    logger.info('版本更新成功');
    // logger.info('正在清理发布目录...');
    // shell.exec(['rm', '-rf', build_rs.out_dir].join(' '));
    // logger.info('清理发布目录完成');

    // logger.warn('other info:');
    // logger.info(log);

    res.status(200).json({
      code: 200,
      data: '项目发布成功'
    });
  });
});
