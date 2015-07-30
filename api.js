var express = require('express');
var router = express.Router();

var download = require('./controller/download');
var deploy = require('./controller/deploy');
var auth_service = require('./service/authorization');
var progresor = require('./controller/progress');

module.exports = router;

router.use(function(req, res, next) {
  var method = req.method.toLowerCase();

  if (method === 'get' &&
    !auth_service.check(req.query.secret) ||
    method === 'post' && !auth_service.check(req.body.secret)) {
    logger.warn('403 请求, ip: ' + req.ip);
    res.status(403).send('无权限');
    return;
  }

  next();
});

router.get('/alpha/:name', download);
router.post('/alpha', deploy);
router.get('/alpha/:owner/:name/progress', progresor);
