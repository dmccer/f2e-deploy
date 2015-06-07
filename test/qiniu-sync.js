var chai = require('chai');
var assert = chai.assert;

var path = require('path');
var shell = require('shelljs');

var config = require('../config');
var qiniu_sync = require('../service/qiniu-sync');
var Deploger = require('../service/deploger');

describe('service/qiniu-sync.js', function() {
  var outdir = 'deploy/alpha/f2e/demigod';
  var logdir = 'log/f2e';
  var logfile = path.join(logdir, 'demigod.log');

  shell.exec('mkdir -p ' + logdir);
  shell.exec('touch ' + logfile);
  shell.exec('> ' + logfile);

  var deploger = new Deploger(logfile, 'qiniu_sync');

  describe('module.exports()', function() {
    afterEach(function() {
      deploger.removeAllListeners();
    });

    it('should throw err and msg when update qiniu config file failed', function() {
      shell.exec('mv ' + config.qiniu + ' ' + config.qiniu + '.bak');
      assert.throws(qiniu_sync.bind(null, deploger), '更新七牛配置文件' + config.qiniu + '失败');
      shell.exec('mv ' + config.qiniu + '.bak' + ' ' + config.qiniu);
    });
  });
});

