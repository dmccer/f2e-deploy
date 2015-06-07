var path = require('path');
var shell = require('shelljs');
var config = require('../config');
var build = require('../service/build');
var origin_sync = require('../service/origin-sync');
var qiniu_sync = require('../service/qiniu-sync');
var generate_tar_gz = require('../service/tar-gz');
var version = require('../service/version');
var Deploger = require('../service/deploger');

module.exports = function (req, res) {
  var repos = req.body.repository;

  var log_dir = path.join('log/', repos.owner.username);
  var log_file = repos.name + '.log';

  var deploger = new Deploger(log_dir, log_file);
  var err_msg, err;

  deploy_log_listener(deploger);

  deploger.emit('before-deploy', {
    log_dir: log_dir,
    log_file: log_file,
    env: 'alpha'
  });

  // 创建日志文件
  try {
    mk_log(deploger, log_dir, log_file);
  } catch(e) {
    err_msg = '步骤1失败: 创建日志目录或文件';
    err = new Error(err_msg);

    deploger.emit('mk-log-err', {
      msg: err_msg,
      err: err
    });

    return res.status(200).json({
      code: 500,
      data: err_msg
    });
  }

  // build 项目
  deploger.emit('before-build');
  var build_rs;

  try {
    build_rs = build(
      req.body,
      config.alpha_work_path
    );
  } catch(e) {
    err_msg = '步骤2失败: build 项目';
    err = new Error(err_msg);

    deploger.emit('build-err', {
      msg: err_msg,
      err: err
    });

    return res.status(200).json({
      code: 500,
      data: err_msg
    });
  }
  deploger.emit('after-build');

  // 项目 package.json
  var pkg = require(path.resolve(build_rs.out_dir, './package.json'));

  // 同步到静态资源服务器
  try {
    origin_sync(deploger, pkg, build_rs);
  } catch(e) {
    err_msg = '步骤3失败: 同步到静态资源服务器';
    err = new Error(err_msg);

    deploger.emit('origin-sync-err', {
      msg: err_msg,
      err: err
    });

    res.status(200).json({
      code: 500,
      data: err_msg
    });
  }

  // 同步项目到七牛服务器
  try {
    qiniu_sync();
  } catch(e) {
    err_msg = '步骤4失败: 同步项目到七牛服务器';
    err = new Error(err_msg);

    deploger.emit('qiniu-sync-err', {
      msg: err_msg,
      err: err
    });

    return res.status(200).json({
      code: 500,
      data: err_msg
    });
  }
  deploger.emit('after-sync-tasks');

  try {
    generate_tar_gz(deploger, build_rs, pkg);
  } catch(e) {
    err_msg = '步骤5失败: 生成静态项目压缩包';
    err = new Error(err_msg);

    deploger.emit('generate-tar-gz-err', {
      msg: err_msg,
      err: err
    });

    return res.status(200).json({
      code: 500,
      data: err_msg
    });
  }

  try {
    version({
      owner: build_rs.repository.owner.username,
      name: build_rs.repository.name,
      version: pkg.version,
      url: build_rs.repository.url,
      download: 'http://d.ifdiu.com/f2e/alpha/' + build_rs.repository.name + '?secret=yunhua@926&owner=' + build_rs.repository.owner.username
    }, function() {
      deploger.emit('after-update-version');
      // TODO
      // 新建函数处理下面任务
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
  } catch(e) {
    err_msg = '步骤6失败: 更新版本数据库失败';
    err = new Error(err_msg);

    deploger.emit('update-version-err', {
      msg: err_msg,
      err: err
    });

    return res.status(200).json({
      code: 500,
      data: err_msg
    });
  }
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

  // 基本不会 throw  err
  shell.exec('touch ' + log_file);

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

function deploy_log_listener(deploger) {
  var logger = deploger.logger;
  var errHandler = deploger.errHandler;

  deploger
    .on('before-deploy', function(data) {
      logger.trace('发布' + data.env + '环境中');
    })
    .on('mk-log-err', errHandler)
    .on('before-build', function() {})
    .on('after-build', function() {})
    .on('build-err', errHandler)
    .on('origin-sync-err', errHandler)
    .on('qiniu-sync-err', errHandler)
    .on('after-sync-tasks', function() {
      logger.info('静态资源发布到服务器成功');
    })
    .on('generate-tar-gz-err', errHandler)
    .on('after-update-version', function() {
      logger.info('版本更新成功');
    })
  ;
}
