var express = require('express');
var router = express.Router();

var download = require('./controller/download');
var push = require('./controller/push');
var progresor = require('./controller/progress');
var deployment = require('./controller/deployment');
var auth = require('./middleware/auth');

module.exports = router;

router.get('/:name', auth.api, download);

router.post('/', auth.api, push);
router.post('/deployment/:repo_id', auth.require_user, deployment);
router.get('/deployment/:repo_id/progress', auth.require_user, progresor);
