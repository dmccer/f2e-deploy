var url = require('url');
var config = require('../config');
var request = require('request');
var logger = require('../logger')('publish');

module.exports = function (params, callback) {
  logger.info('即将写入的数据: ' + JSON.stringify(params));

  var opt = {
    method: 'POST',
    url: url.resolve(config.vermgr.url, 'repos/' + params.name),
    form: {
      owner: params.owner,
      version: params.version,
      url: params.url
    },
    headers: {
      Authorization: config.vermgr.authorization
    }
  };

  logger.trace('请求地址: ' + opt.url);

  request(opt, function(err, res, body) {
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);

      logger.info('写入版本到数据库成功');
      logger.info(JSON.stringify(data));
    } else {
      logger.fatal('写入版本到数据库失败');
      logger.info('status code: ' + res.statusCode);
      logger.info('response body: ' + body);
      logger.info('错误信息: ' + err.message);
    }

    callback();
  });
};
