/**
 * @file 部署模型
 * @author Kane yunhua.xiao@guluauto.com
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deployment = new Schema({
  // 分支名
  branch: String,
  // 环境
  env: { id: Schema.Types.ObjectId, alias: String },
  // 项目 id
  repo_id: Schema.Types.ObjectId,
  // before commit
  before: String,
  // after commit
  after: String,
  // 版本
  version: String,
  // 可操作用户
  pubers: [{
    name: String,
    username: String,
    email: String
  }],
  // 静态包下载地址
  download: String,
  // 项目状态
  // 0 - 空闲
  // 1 - 发布中
  status: { type: Number, default: 0 },
  // 项目发布进度，默认未发布
  // -1 - 发布失败
  // 0 - 未发布
  // 1 - 正在下载项目资源
  // 2 - 正在编译项目
  // 3 - 正在发布到静态服务器
  // 4 - 正在同步到七牛服务器
  // 5 - 正在更新数据库版本
  // 6 - 正在生成静态资源压缩包
  // 7 - 发布完成
  progress: { type: Number, default: 0 },
  // 记录创建时间（首次发布时间）
  create_time: { type: Date, default: Date.now },
  // 记录更新时间（最后一次发布时间）
  update_time: { type: Date, default: Date.now }
});

// 返回数据给用户时，将 _id 属性重命名为 id
deployment.set('toObject', {
  versionKey: false,

  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

/**
 * @module Deployment
 * @type {*|Model}
 */
module.exports = mongoose.model('Deployment', deployment);
