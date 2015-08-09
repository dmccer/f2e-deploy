/**
 * @file 发布环境
 * @author Kane yunhua.xiao@guluauto.com
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var env = new Schema({
  // 环境名称
  name: String,
  // 别名
  alias: String,
  // 环境描述
  description: String,
  // 环境 url 地址
  url: String
});

// 返回数据给用户时，将 _id 属性重命名为 id
env.set('toObject', {
  versionKey: false,

  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

module.exports = mongoose.model('Env', env);