/**
 * Repo Site Controllers
 * @type {*|Model|exports|module.exports}
 */
var repo = require('../model/repo');
var depoloyment = require('../model/deployment');

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
    }, function(err) {
      r.err = err;
      res.status(200).render('repo', r);

      throw err;
    })
    .then(function(repo_id) {
      return depoloyment.find({
        repo_id: repo_id
      }).exec();
    })
    .then(function(docs) {
      docs.forEach(function(doc) {
        doc.progress_text = progress[doc.progress];
        doc.status_text = status[doc.status];
      });

      r.deployments = docs;

      res.status(200).render('repo', r);
    }, function(err) {
      r.err = err;

      res.status(200).render('repo', r);

      throw err;
    })
    .catch(function(err) {
      console.log('发生了点意外：');
      console.log(err);
    });
}