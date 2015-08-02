/**
 * Created by Kane on 15/8/2.
 */
var mongoose = require('mongoose');
var path = require('path');
var config = require('./config');

function connect() {
  console.info('正在连接数据库...');
  mongoose.connect(config.mongodb.url + ':' + config.mongodb.port + '/' + config.mongodb.name);
  console.info('数据库连接成功...');
}

connect();

mongoose.connection.on('error', function(err) {
  console.error('数据库连接错误：');
  console.info(err.message);
});

mongoose.connection.on('disconnected', function() {
  console.warn('数据库连接断开，正重连...');
  connect();
  console.warn('数据库重新连接成功');
});

