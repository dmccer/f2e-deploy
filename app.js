var express = require('express');
var bodyParser = require('body-parser');
var f2e = require('./routes/f2e');
var auth_service = require('./service/authorization');
var log4js = require('log4js');
var logger = require('./logger')('express');
var app = express();

app.use(log4js.connectLogger(logger, { level: 'auto' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
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

app.use('/f2e', f2e);

var server = app.listen(9999, function () {

  var host = server.address().address;
  var port = server.address().port;

  logger.info('静态资源发布服务器已启动，地址：' + host + '，端口:' + port);
});
