/**
 * @file 部署模型
 * @author Kane yunhua.xiao@guluauto.com
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deployment = new Schema({
  id: String,
  // 分支名
  branch: String,
  // 项目 id
  repo_id: ObjectId,
  // before commit
  cbefore: String,
  // after commit
  cafter: String,
  // 版本
  version: String,
  // 可操作用户
  pubers: [{
    name: String,
    username: String,
    email: String
  }]
});

// 返回数据给用户时，将 _id 属性重命名为 id
deployment.set('toObject', {
  versionKey: false,

  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

module.exports = mongoose.model('Deployment', deployment);
