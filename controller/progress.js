var path = require('path');
var shell = require('shelljs');
var _ = require('lodash');
var config = require('../config');

module.exports = function(req, res) {
  var owner = _.trim(req.query.owner);
  var name = _.trim(req.params.name);

  
};
