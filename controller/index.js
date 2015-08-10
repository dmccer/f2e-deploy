/**
 * Repo Site Controllers
 * @type {*|Model|exports|module.exports}
 */
var _ = require('lodash');
var repo = require('../model/repo');
var depoloyment = require('../model/deployment');
var env = require('../model/env');
var config = require('../config');

var progress = {
  '-1': '发布失败',
  '0': '未发布',
  '1': '正在下载项目资源',
  '2': '正在编译项目',
  '3': '正在发布到静态服务器',
  '4': '正在同步到七牛服务器',
  '5': '正在更新数据库版本',
  '6': '正在生成静态资源压缩包',
  '7': '发布完成'
};

var status = {
  '0': '空闲',
  '1': '发布中'
};

/**
 * 首页项目列表页
 * @param req
 * @param res
 */
exports.list = function(req, res) {
  repo.find({}, function(err, docs) {
    var r = {};

    if (err) {
      r.repos = [];
    } else {
      r.repos = docs;
    }

    return res.status(200).render('index', r);
  });
}

/**
 * 项目详情页
 * @param req
 * @param res
 */
exports.repo = function(req, res) {
  var owner = req.params.owner;
  var name = req.params.name;

  var r = {};
  function handle_err(err) {
    r.err = err.message;
    res.status(200).render('repo', r);

    throw err;
  }

  new Promise(function(resolve, reject) {
    repo.findOne({
      name: name,
      'owner.username': owner
    }, function(err, doc) {
      if (err) {
        reject(err);
        return;
      }
      resolve(doc);
    });
  }).then(function(doc) {
      r.repo = doc.toObject();

      return doc.id;
    }, handle_err)
    .then(function(repo_id) {
      return depoloyment.find({
        repo_id: repo_id
      }).exec();
    })
    .then(function(deployments) {
      return env
        .find({})
        .exec()
        .then(function(envs) {
          return Promise.resolve({
            deployments: deployments,
            envs: envs
          });
        });
    }, handle_err)
    .then(function(mix) {
      var branches = [];

      mix.deployments.forEach(function(doc) {
        doc.progress_text = progress[doc.progress];
        doc.status_text = status[doc.status];

        if (doc.env.id != null) {
          console.log(mix.envs, doc.env.id);

          var env_item = _.find(mix.envs, function(env) {
            return env.id.toString() === doc.env.id.toString()
          });

          env_item.deployment = doc;
        } else {
          branches.push(doc.branch);
        }
      });

      r.envs = mix.envs;
      r.branches = branches;
      r.default_secret = config.default_secret;

      res.status(200).render('repo', r);
    }, handle_err)
    .catch(function(err) {
      console.log('发生了点意外：');
      console.log(err);

      res.status(500).render('error', {
        err: err
      });
    });
}