var path = require('path');
var shell = require('shelljs');
var config = require('../config');
var build = require('../service/build');
var origin_sync = require('../service/origin_sync');
var qiniu_sync = require('../service/qiniu-sync');
var version = require('../service/version');
var Deploger = require('../service/deploger');

module.exports = function (req, res) {
  var repos = req.body.repository;

  var log_dir = path.join('log/', repos.owner.username);
  var log_file = repos.name + '.log';

  var deploger = new Deploger(log_dir, log_file);

  deploger.emit('before-deploy', {
    log_dir: log_dir,
    log_file: log_file,
    env: 'alpha'
  });

  try {
    mk_log(deploger, log_dir, log_file);
  } catch(e) {
    return res.status(200).json({
      code: 500,
      data: e.message
    });
  }

  deploger.emit('before-build');
  var build_rs = build(
    req.body,
    config.alpha_work_path
  );

  if (!build_rs) {
    deploger.emit('build-err', {
      msg: '预处理静态资源失败',
      err: new Error('')
    });

    return res.status(200).json({
      code: 500,
      data: '预处理静态资源过程中发生错误'
    });
  }

  deploger.emit('after-build');

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

      res.status(200).json({
        code: 500,
        data: '上传七牛服务器失败'
      });

      return;
    }
    logger.info(qiniu_sync_rs);
    logger.info('上传七牛成功');
  } catch(e) {
    // 暂不做处理，因为七牛服务器不接受 html 文件，所以导致错误
    logger.fatal('七牛传输 html 文件失败');
    logger.info(e);
  }

  logger.info('静态资源发布成功');

  logger.info('正在生成静态资源压缩包...');
  // TODO
  // 优化：工作区压缩，然后上传到静态服务器

  // 进入静态服务器目录
  shell.cd(path.dirname(dest_dir));

  var tar_gz_tip_prefix = '生成静态资源压缩包' + path.resolve(dest_dir, pkg.version);
  var tar_gz = shell.exec('sudo tar -czvf ' + pkg.version + '.tar.gz ' + pkg.version);
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
  logger.info(tar_gz.output);
  logger.info(tar_gz_tip_prefix + '成功');

  logger.info('正在更新版本数据库...');
  version({
    owner: build_rs.repository.owner.username,
    name: build_rs.repository.name,
    version: pkg.version,
    url: build_rs.repository.url,
    download: 'http://d.ifdiu.com/f2e/alpha/' + build_rs.repository.name + '?secret=yunhua@926&owner=' + build_rs.repository.owner.username
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
};

function mk_log(deploger, log_dir, log_file) {
  var err_msg;

  log_file = path.join(log_dir, log_file);

  var mkdir_log = shell.exec('mkdir -p ' + log_dir);
  if (mkdir_log.code !== 0) {
    err_msg = '创建日志目录' + log_dir + '失败';

    deploger.emit('mkdir-log-err', {
      msg: err_msg,
      err: new Error(mkdir_log.output)
    });

    throw new Error(err_msg);
  }

  shell.exec('touch ' + log_file)

  // var touch_logfile = shell.exec('touch ' + log_file);
  // if (touch_logfile.code !== 0) {
  //   err_msg = '创建日志文件' + log_file + '失败';

  //   deploger.emit('touch-logfile-err', {
  //     msg: err_msg,
  //     err: new Error(touch_logfile.output)
  //   });

  //   throw new Error(err_msg);
  // }

  var clear_logfile = shell.exec('> ' + log_file);
  if (clear_logfile.code !== 0) {
    err_msg = '清空日志文件' + log_file + '失败';

    deploger.emit('clear-logfile-err', {
      msg: err_msg,
      err: new Error(clear_logfile.output)
    });

    throw new Error(err_msg);
  }
}
