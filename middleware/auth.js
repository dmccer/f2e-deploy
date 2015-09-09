var config = require('../config');

function api_check(secret) {
  return secret === config.default_secret;
}

exports.api = function(req, res, next) {
  var method = req.method.toLowerCase();

  if (method === 'get' &&
    !api_check(req.query.secret) ||
    method === 'post' && !api_check(req.body.secret)) {
    console.warn('403 请求, ip: ' + req.ip);
    res.status(403).send('无权限');
    return;
  }

  next();
}

exports.auth_user = function(req, res, next) {
  res.locals.user = null;

  if (req.session.user) {
    res.locals.user = req.session.user = config.user;
  }

  next();
}

exports.require_user = function(req, res, next) {
  var user = req.session.user;

  if (!user) {
    return res.redirect('/login');
  }

  next();
}
