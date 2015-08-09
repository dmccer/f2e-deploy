/**
 * 发布
 * @author Kane yunhua.xiao@guluauto.com
 * @type {*|Model|exports|module.exports}
 */
var deployment = require('../model/deployment');
var repo = require('../model/repo');
var Deployer = require('../service/deployer');

module.exports = function(req, res) {
  var deployment_id = req.params.deployment_id;

  try {
    deployment.findById(deployment_id, function(err, _deployment) {
      if (err) {
        throw err;
      }

      // 发布中
      if (doc.status === 1) {
        return res.status(200).json({
          status: _deployment.status,
          progress: _deployment.progress
        });
      }

      repo.findById(_deployment.repo_id, function(err, _repo) {
        if (err) {
          throw err;
        }

        // 发布
        // repo_id, name, username, url, branch, after, suffix, env
        var deployer = new Deployer({
          repo_id: _deployment.repo_id,
          branch: _deployment.branch,
          after: _deployment.after,
          name: _repo.name,
          username: _repo.owner.username,
          url: _repo.url,
          env: _deployment.env.alias
        });

        deployer
          .run()
          .then(function() {
            res.status(200).json({
              complete: true
            });
          })
          .catch(function(err) {
            res.status(500).json({
              err: err.message
            });
          });
      });
    });
  } catch (e) {
    res.status(500).json({
      err: e.message
    });
  }
}