var path = require('path');
var _ = require('lodash');
var config = require('../config');
var deployment = require('../model/deployment');

module.exports = function(req, res) {
  var repo_id = _.trim(req.params.repo_id);
  var branch = _.trim(req.query.branch);
  var env = _.trim(req.query.env);

  process.send({ access: '/progress', workerid: process.pid });

  deployment.findOne({
    repo_id: repo_id,
    branch: branch,
    'env.alias': env
  },  function(err, doc) {
    if (err) {
      return res.status(500).json({
        msg: err.message
      });
    }

    var deployment_item = doc || {};

    if (deployment_item.progress === -1) {
      return res.status(200).json({
        fail: true
      });
    }

    return res.status(200).json({
      progress: Math.floor(deployment_item.progress / 7 * 100)
    });
  });
};
