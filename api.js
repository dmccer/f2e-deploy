var express = require('express');
var router = express.Router();

var download = require('./controller/download');
var deploy = require('./controller/deploy');
var logpool = require('./controller/logpool');

module.exports = router;

router.get('/alpha/:name', download);
router.post('/alpha', deploy);
router.post('/alpha/:name/log', logpool);
