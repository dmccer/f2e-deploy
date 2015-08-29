var config = require('../config');

exports.require_user = function(req, res, next) {
  var user = req.session.user;

  if (!user) {
    return res.redirect('/login');
  }

  next();
}
exports.show_login = function(req, res) {
  res.render('login');
}

exports.login = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  if (username !== config.user.username || password !== config.user.password) {
    res.status(403).render('login', { err: '用户名密码不正确!' });

    return;
  }

  req.session.user = config.user;

  res.redirect('/repos');
}

exports.log_off = function(req, res) {
  req.session.destroy();
  res.clearCookie(config.auth_cookie_name, { path: '/' });
  res.redirect('/login');
}

exports.auth_user = function(req, res, next) {
  res.locals.user = null;

  if (req.session.user) {
    res.locals.user = req.session.user = config.user;
  }

  next();
}
