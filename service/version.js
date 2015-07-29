var url = require('url');
var path = require('path');
var config = require('../config');
var request = require('request');

module.exports = function (deploger, params) {
  var _url = url.resolve(config.vermgr.url, 'repos/' + params.name);

  version_log_listener(deploger);
  deploger.emit('before-update-version', params, _url);

  var opt = {
    method: 'POST',
    url: _url,
    form: {
      owner: params.owner,
      version: params.version,
      url: params.url,
      status: params.status,
      download: params.download
    },
    headers: {
      Authorization: config.vermgr.authorization
    }
  };

  return new Promise(function (resolve, reject) {
    request(opt, function(err, res, body) {
      var error;

      if (!err && res.statusCode == 200) {
        deploger.emit('req-update-version-success', JSON.parse(body));
      } else {
        deploger.emit('req-update-version-err', err, res, body);
        error = new Error('写入版本到数据库失败');
      }

      if (error) {
        return reject(error);
      }

      resolve();
    });
  });
};


function version_log_listener(deploger) {
  var logger = deploger.logger;

  deploger
    .on('before-update-version', function(params, url) {
      logger.trace('正在更新版本数据库...');
      logger.info('vermgr 服务器: ' + url);
      logger.info(JSON.stringify(params));
    })
    .on('req-update-version-success', function(body) {
      logger.info('写入版本到数据库成功');
      logger.info(JSON.stringify(body));
    })
    .on('req-update-version-err', function(err, res, body) {
      logger.fatal('写入版本到数据库失败');
      logger.info('status code: ' + res.statusCode);
      logger.info('response body: ' + body);
      logger.info('错误信息: ' + (err && err.message));
    })
  ;
}
