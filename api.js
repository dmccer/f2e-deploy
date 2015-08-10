var express = require('express');
var router = express.Router();

var download = require('./controller/download');
var push = require('./controller/push');
var auth_service = require('./service/authorization');
var progresor = require('./controller/progress');
var deployment = require('./controller/deployment');

module.exports = router;

router.use(function(req, res, next) {
  var method = req.method.toLowerCase();

  if (method === 'get' &&
    !auth_service.check(req.query.secret) ||
    method === 'post' && !auth_service.check(req.body.secret)) {
    //logger.warn('403 请求, ip: ' + req.ip);
    res.status(403).send('无权限');
    return;
  }

  next();
});

router.get('/:name', download);
router.post('/', push);
router.post('/deployment/:repo_id', deployment);
router.get('/:owner/:name/progress', progresor);
