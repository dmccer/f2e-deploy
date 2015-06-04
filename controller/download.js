var path = require('path');
var shell = require('shelljs');
var config = require('../config');

module.exports = function(req, res) {
  var logger = require('../logger')('log/down_gz.log', 'downgz');
  var owner = req.query.owner;
  var name = req.params.name;

  if (!owner || !name) {
    res.status(200).json({
      data: owner + '或项目名称不能为空'
    });

    return;
  }

  var repos_work_dir = path.resolve(config.alpha_work_path, owner, name);
  var deployed_dir = path.resolve(config.static_server.alpha, owner, name);

  if (!shell.test('-e', repos_work_dir)) {
    res.status(200).json({
      data: owner + '/' + name + '项目不存在或从未发布'
    });

    return;
  }

  var pkg = require(path.resolve(repos_work_dir, './package.json'));
  var filename = pkg.version + '.tar.gz';
  var fileurl = path.resolve(deployed_dir, filename);
  if (!shell.test('-f', fileurl)) {
    res.status(200).json({
      data: owner + '/' + name + '项目从未发布成功'
    });

    return;
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
};
