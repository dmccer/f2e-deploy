/**
 * Created by Kane on 15/7/29.
 */
var url = require('url');
var config = require('../config');
var request = require('request');

var vermgr = {
  get: function(params, callback) {
    var _url = url.resolve(config.vermgr.url, 'repos/' + params.name);
    var opt = {
      method: 'GET',
      url: _url,
      qs: {
        owner: params.owner
      },
      headers: {
        Authorization: config.vermgr.authorization
      }
    };

    request(opt, function(err, res, body) {
      var body = JSON.parse(body);

      if (!err && res.statusCode == 200) {
        callback(null, body);
      } else {
        callback(new Error(body.msg));
      }
    });
  },

  list: function(params, callback) {
    var _url = url.resolve(config.vermgr.url, 'repos');
    var opt = {
      method: 'GET',
      url: _url,
      qs: params,
      headers: {
        Authorization: config.vermgr.authorization
      }
    };

    request(opt, function(err, res, body) {
      var body = JSON.parse(body);

      if (!err && res.statusCode == 200) {
        callback(null, body.data);
      } else {
        callback(new Error(body.msg));
      }
    });
  },

  update: function(params, callback) {
    var _url = url.resolve(config.vermgr.url, 'repos/' + params.name);

    var opt = {
      method: 'POST',
      url: _url,
      form: {
        name: params.name,
        owner: params.owner,
        status: params.status
      },
      headers: {
        Authorization: config.vermgr.authorization
      }
    };

    request(opt, function(err, res, body) {
      var error;
      var body = JSON.parse(body);

      if (!err && res.statusCode == 200) {
        console.log(body);
      } else {
        error = new Error(body.msg);
      }

      callback(error);
    });
  }
};

module.exports = vermgr;