/**
 * 发布
 * @author Kane yunhua.xiao@guluauto.com
 * @type {*|Model|exports|module.exports}
 */
var deployment = require('../model/deployment');
var repo = require('../model/repo');
var env = require('../model/env');
var config = require('../config');
var Deployer = require('../service/deployer');

module.exports = function(req, res) {
  var repo_id = req.params.repo_id;

  try {
    deployment.findOne({
      repo_id: repo_id,
      branch: req.body.branch
    }, function(err, _deployment) {
      if (err) {
        throw err;
      }

      // 发布中
      if (_deployment.status === 1) {
        return res.status(200).json({
          status: _deployment.status,
          progress: _deployment.progress
        });
      }

      env.findById(req.body.env_id, function(err, _env) {
        if (err) {
          throw err;
        }

        _deployment.status = 1;
        _deployment.env.id = _env._id;
        _deployment.env.alias = _env.alias;

        _deployment.save();

        repo.findById(repo_id, function(err, _repo) {
          if (err) {
            _deployment.status = 0;
            _deployment.progress = 0;
            _deployment.save();

            res.status(500).json({
              err: err.message
            });

            throw err;
          }

          // 发布
          // repo_id, name, username, url, branch, after, suffix, env
          var data = {
            repo_id: _deployment.repo_id,
            branch: _deployment.branch,
            after: _deployment.after,
            name: _repo.name,
            username: _repo.owner.username,
            url: _repo.url,
            env: _env.alias
          };

          var deployer = new Deployer(data);

          process.send({ access: 'deploying', workerid: process.pid });

          deployer
            .run()
            .then(function() {
              _deployment.status = 0;
              _deployment.save();

              res.status(200).json({
                complete: true
              });
            })
            .catch(function(err) {
              _deployment.status = 0;
              _deployment.progress = 0;
              _deployment.save();

              res.status(500).json({
                err: err.message
              });
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