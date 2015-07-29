var path = require('path');
var shell = require('shelljs');
var config = require('../config');
var build = require('../service/build');
var origin_sync = require('../service/origin-sync');
var qiniu_sync = require('../service/qiniu-sync');
var generate_tar_gz = require('../service/tar-gz');
var version = require('../service/version');
var Deploger = require('../service/deploger');
var status_api = require('../service/status');
//var reser = require('../util/reser');

module.exports = function (req, res) {
  var _deploger = new Deploger('log/deploy.log', 'deploy');
  _deploy_log_listener(_deploger);

  var repos = req.body.repository;

  var log_dir = path.join('log/', repos.owner.username);
  var log_file = repos.name + '.log';
  var err_msg, err;

  _deploger.emit('before-deploy', {
    log_dir: log_dir,
    log_file: log_file,
    env: 'alpha'
  });

  // 创建日志文件
  try {
    mk_log(_deploger, log_dir, log_file);
  } catch (e) {
    err_msg = '步骤1失败: 创建日志目录或文件';
    err = new Error(err_msg);

    _deploger.emit('mk-log-err', {
      msg: err_msg,
      err: err
    });

    return res.status(500).json({
      code: 500,
      data: err_msg
    });
  }

  var deploger = new Deploger(path.join(log_dir, log_file), 'publish');
  deploy_log_listener(deploger);

  // build 项目
  deploger.emit('before-build');

  // 项目 package.json
  var pkg_json_file, pkg, build_rs;

  build(deploger, req.body, config.alpha_work_path)
    .then(function (rs) {
      build_rs = rs;
      pkg_json_file = path.resolve(build_rs.out_dir, './package.json');
      require.cache[pkg_json_file] = null;
      pkg = require(pkg_json_file);

      // 同步到静态资源服务器
      origin_sync(deploger, pkg, build_rs);

      deploger.emit('after-build');

      return new Promise(function (resolve, reject) {
        status_api.update({
          name: repos.name,
          owner: repos.owner.username,
          status: 4
        }, function (err) {
          if (err) {
            return reject(err);
          }

          return resolve();
        });
      });
    })
    .then(function () {
      qiniu_sync(deploger);
      deploger.emit('after-sync-tasks');

      return new Promise(function (resolve, reject) {
        status_api.update({
          name: repos.name,
          owner: repos.owner.username,
          status: 5
        }, function (err) {
          if (err) {
            return reject(err);
          }

          return resolve();
        });
      });
    })
    .then(function () {
      generate_tar_gz(deploger, build_rs, pkg);

      return new Promise(function (resolve, reject) {
        status_api.update({
          name: repos.name,
          owner: repos.owner.username,
          status: 6
        }, function (err) {
          if (err) {
            return reject(err);
          }

          return resolve();
        });
      });
    })
    .then(function () {
      return version(deploger, {
        owner: build_rs.repository.owner.username,
        name: build_rs.repository.name,
        version: pkg.version,
        status: 7,
        download: config.download_url + build_rs.repository.name + '?secret=yunhua@926&owner=' + build_rs.repository.owner.username
      });
    })
    .then(function () {
      deploger.emit('after-update-version');

      res.status(200).json({
        code: 200,
        data: '项目发布成功'
      });
    })
    .catch(function (err) {
      deploger.emit('build-err', {
        msg: err.message,
        err: err
      });

      return res.status(200).json({
        code: 500,
        data: err.message
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

function _deploy_log_listener(deploger) {
  var logger = deploger.logger;
  var errHandler = deploger.errHandler;

  deploger
    .on('before-deploy', function (data) {
      logger.trace('发布' + data.env + '环境中');
    })
    .on('mk-log-err', errHandler)
  ;
}

function deploy_log_listener(deploger) {
  var logger = deploger.logger;
  var errHandler = deploger.errHandler;

  deploger
    .on('before-build', function () {
    })
    .on('after-build', function () {
    })
    .on('build-err', errHandler)
    .on('origin-sync-err', errHandler)
    .on('qiniu-sync-err', errHandler)
    .on('after-sync-tasks', function () {
      logger.info('静态资源发布到服务器成功');
    })
    .on('generate-tar-gz-err', errHandler)
    .on('after-update-version', function () {
      logger.info('版本更新成功');
    })
  ;
}
