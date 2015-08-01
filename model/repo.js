/**
 * @file 仓库模型
 * @author Kane yunhua.xiao@guluauto.com
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var repo = new Schema({
  // 项目 ID
  repo_id: Number,
  // 项目名
  name: String,
  // 项目拥有者或项目组名
  owner: Object,
  // 项目 git url
  url: String,
  // 项目描述
  description: String,
  // 站点
  website: String,
  // 关注者数量
  watchers: Number,
  // 项目私有
  _private: Boolean
});

// 返回数据给用户时，将 _id 属性重命名为 id
repo.set('toObject', {
  versionKey: false,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

module.exports = mongoose.model('Repo', repo);