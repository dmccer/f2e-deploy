var path = require('path');
var _ = require('lodash');
var config = require('../config');
var Status = require('../service/status');

module.exports = function(req, res) {
  var owner = _.trim(req.query.owner);
  var name = _.trim(req.params.name);

  Status.get({
    name: name,
    owner: owner
  }, function(err, body) {
    if (err) {
      return res.status(500).json({
        msg: err.message
      });
    }

    var repos = body.data || {};

    if (repos.status === -1) {
      return res.status(200).json({
        fail: true
      });
    }

    return res.status(200).json({
      progress: Math.floor(repos.status / 7 * 100)
    });
  });
};
