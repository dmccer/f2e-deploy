/**
 * Created by Kane on 15/7/29.
 */
var url = require('url');
var config = require('../config');
var request = require('request');

var Status = {
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

module.exports = Status;