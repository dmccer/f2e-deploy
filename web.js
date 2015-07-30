/**
 * Created by Kane on 15/7/30.
 */
var express = require('express');
var router = express.Router();
var index = require('./controller/index');

router.get('/', index.list);
router.get('/repos/:owner/:name', index.repo);

module.exports = router;
