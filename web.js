/**
 * Created by Kane on 15/7/30.
 */
var express = require('express');
var router = express.Router();
var index = require('./controller/index');
var sign = require('./controller/sign');

router.get('/', sign.require_user, function(req, res) {
  res.redirect('/repos');
});
router.get('/login', sign.show_login);
router.post('/login', sign.login);
router.get('/logout', sign.log_off);

router.get('/repos', sign.require_user, index.list);
router.get('/repos/:owner/:name', sign.require_user, index.repo);

module.exports = router;
