var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');

var path = require('path');
var shell = require('shelljs');
var rewire = require('rewire');

var config = require('../config');
var version = rewire('../service/version');
var Deploger = require('../service/deploger');

describe('service/version.js', function() {
  var logdir = 'log/f2e';
  var logfile = path.join(logdir, 'demigod.log');

  shell.exec('mkdir -p ' + logdir);
  shell.exec('touch ' + logfile);
  shell.exec('> ' + logfile);

  var deploger = new Deploger(logfile, 'qiniu_sync');
  var params = {
    name: 'demigod',
    owner: 'f2e',
    version: '0.0.0',
    url: 'http://git.guluabc.com/f2e/demigod'
  };

  describe('module.exports()', function() {
    var reqErr = function(opt, callback) {
      callback(null, {
        statusCode: 500
      }, '服务器内部错误');
    };

    var reqOk = function(opt, callback) {
      callback(null, {
        statusCode: 200
      }, JSON.stringify(params));
    };

    var request = version.__get__('request');

    afterEach(function() {
      deploger.removeAllListeners();
      version.__set__('request', request);
    });

    it('should callback when request update version complete', function() {
      version.__set__('request', reqOk);

      var spy = sinon.spy();
      version(deploger, params, spy);
      assert(spy.calledOnce);
    });

    it('should callback with err when request update versioin failed', function() {
      version.__set__('request', reqErr);

      var err = new Error('写入版本到数据库失败');
      var callback = sinon.spy();
      version(deploger, params, callback);
      assert(callback.calledWith(err));
    });

  });
});

