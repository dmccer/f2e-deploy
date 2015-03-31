var express = require('express');
var router = express.Router();
var config = require('../config');
var f2e_build = require('../service/f2e-build');
var f2e_sync = require('../service/f2e-sync');

module.exports = router;

router.post('/alpha', function (req, res) {
  console.log('准备发布 alpha 环境...');

  var log;

  console.log(req.body);

  var build_rs = f2e_build(
    req.body,
    config.alpha_work_path
  );

  if (build_rs) {
    log = build_rs.log + f2e_sync(
      build_rs.out_file,
      config.static_server.alpha
    );
  }

  res.status(200).json({
    code: 200,
    data: log
  });
});