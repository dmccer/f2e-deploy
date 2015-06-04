var express = require('express');
var router = express.Router();

var download = require('./controller/download');
var deploy = require('./controller/deploy');

module.exports = router;

router.get('/alpha/:name', download);
router.post('/alpha', deploy);
