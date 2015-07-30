/**
 * Created by Kane on 15/7/30.
 */
var vermgr = require('../service/vermgr');

var status = {
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

exports.list = function(req, res) {
  var query = req.query;
  delete query.secret;

  vermgr.list(query, function(err, body) {
    var r = {};

    if (err) {
      r.repos = [];
    } else {
      body.forEach(function(item) {
        item.status_text = status[item.status.toString()];
      })
      r.repos = body;
    }

    return res.status(200).render('index', r);
  });
}

exports.repo = function(req, res) {
  var owner = req.params.owner;
  var name = req.params.name;

  vermgr.get({
    owner: owner,
    name: name
  }, function(err, body) {
    var r = {};

    if (err) {
      r.repo = {};
    } else {
      body.data.status_text = status[body.data.status.toString()];

      r.repo = body.data;
    }

    return res.status(200).render('repo', r);
  });
}