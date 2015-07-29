/**
 * Created by Kane on 15/7/29.
 */
var url = require('url');
var config = require('../config');
var request = require('request');

var Status = {
  add: function(params, callback) {
    var _url = url.resolve(config.vermgr.url, 'repos');

    var opt = {
      method: 'POST',
      url: _url,
      form: {
        name: param.name,
        owner: params.owner,
        url: params.url,
        status: 1
      },
      headers: {
        Authorization: config.vermgr.authorization
      }
    };

    request(opt, function(err, res, body) {
      var error;

      if (!err && res.statusCode == 200) {
        console.log(JSON.parse(body));
      } else {
        error = new Error('添加项目到数据库失败');
      }

      callback(error);
    });
  },

  update: function(params, callback) {
    var _url = url.resolve(config.vermgr.url, 'repos/' + params.name);

    var opt = {
      method: 'POST',
      url: _url,
      form: {
        name: param.name,
        owner: params.owner,
        status: params.status
      },
      headers: {
        Authorization: config.vermgr.authorization
      }
    };

    request(opt, function(err, res, body) {
      var error;

      if (!err && res.statusCode == 200) {
        console.log(JSON.parse(body));
      } else {
        error = new Error('更新发布状态到数据库失败');
      }

      callback(error);
    });
  }
};

module.exports = Status;