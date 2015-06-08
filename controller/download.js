var path = require('path');
var shell = require('shelljs');
var _ = require('lodash');
var config = require('../config');
var Deploger = require('../service/deploger');

module.exports = function(req, res) {
  var deploger = deploger_factory();
  down_log_listener(deploger);

  var owner = _.trim(req.query.owner);
  var name = _.trim(req.params.name);

  var err_msg, err;

  if (!owner || !name) {
    err_msg = 'owner或name不能为空';
    err = new Error(err_msg);

    deploger.emit('param-invalid', {
      msg: err_msg,
      err: err
    });

    return res.status(200).json({
      data: err_msg
    });
  }

  var repos_work_dir = path.resolve(config.alpha_work_path, owner, name);
  var deployed_dir = path.resolve(config.static_server.alpha, owner, name);

  if (!shell.test('-e', repos_work_dir)) {
    err_msg = owner + '/' + name + '项目不存在或从未发布';
    err = new Error(err_msg);

    deploger.emit('workdir-not-exists', {
      msg: err_msg,
      err: err
    });

    return res.status(200).json({
      data: err_msg
    });
  }

  var pkg = require(path.resolve(repos_work_dir, './package.json'));
  var filename = pkg.version + '.tar.gz';
  var fileurl = path.resolve(deployed_dir, filename);

  if (!shell.test('-f', fileurl)) {
    err_msg = owner + '/' + name + '项目从未发布成功';
    err = new Error(err_msg);

    deploger.emit('target-version-not-exists', {
      msg: err_msg,
      err: err
    });

    return res.status(200).json({
      data: err_msg
    });
  }

  return res.download(fileurl, name + '-' + pkg.version + '.tar.gz', function(err) {
    if (err) {
      deploger.emit('downloading-err', {
        msg: fileurl + '下载失败',
        err: err
      });

      return res.status(err.status).end();
    }

    deploger.emit('download-complete', fileurl);
  });
};

function deploger_factory() {
  var log_file = 'log/down_gz.log';
  var log_dir = path.dirname(log_file);
  var log_category = 'downgz';

  shell.exec('mkdir -p ' + log_dir);
  shell.exec('touch ' + log_file);

  return new Deploger(log_file, 'downgz');
}

function down_log_listener(deploger) {
  var logger = deploger.logger;
  var errHandler = deploger.errHandler;

  deploger
    .on('params-invalid', errHandler)
    .on('workdir-not-exists', errHandler)
    .on('target-version-not-exists', errHandler)
    .on('downloading-err', errHandler)
    .on('download-complete', function(fileurl) {
      logger.info('下载' + fileurl + '成功');
    })
  ;
}
