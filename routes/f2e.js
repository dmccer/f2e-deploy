var express = require('express');
var router = express.Router();
var path = require('path');
var config = require('../config');
var f2e_build = require('../service/f2e-build');
var f2e_sync = require('../service/f2e-sync');
var qiniu_sync = require('../service/qiniu-sync');
var jf = require('jsonfile');

module.exports = router;

router.post('/alpha', function (req, res) {
  console.log('准备发布 alpha 环境...');

  var log;

  var build_rs = f2e_build(
    req.body,
    config.alpha_work_path
  );

  if (!build_rs) {
    return res.status(200).json({
      code: 500,
      data: 'error on build'
    });
  }

  var pkg = require(path.resolve(build_rs.out_dir, './package.json'));
  var src = path.resolve(build_rs, pkg.dest, './*');
  var dest_dir = path.resolve(config.static_server.alpha, pkg.name, pkg.version);

  log = build_rs.log + f2e_sync(src, dest_dir) + qiniu_sync();

  res.status(200).json({
    code: 200,
    data: log
  });
});