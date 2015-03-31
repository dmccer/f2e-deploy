var express = require('express');
var router = express.Router();
var config = require('../config');
var f2e_build_service = require('../service/f2e-build');

module.exports = router;

router.post('/alpha', function (req, res) {
  console.log('准备发布 alpha 环境...');

  f2e_build_service(req.body, config.alpha_work_path);
});