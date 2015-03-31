var express = require('express');
var bodyParser = require('body-parser')
var app = express();

var f2e = require('./routes/f2e');
var auth_service = require('./service/authorization');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(function(req, res, next) {
  var method = req.method.toLowerCase();

  if (method === 'get' && !auth_service.check(req.query.secret)
    || method === 'post' && !auth_service.check(req.body.secret)) {
    res.status(403).send('无权限');
    return;
  }

  next();
});

app.use('/f2e', f2e);

var server = app.listen(9999, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('git web hook server', host, port);
});
