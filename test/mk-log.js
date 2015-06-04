var chai = require('chai');
var assert = chai.assert;

var path = require('path');
var url = require('url');
var fs = require('fs');
var rewire = require('rewire');
var shell = require('shelljs');

var deploger = require('../service/deploger');
var deploy = rewire('../controller/deploy');

describe('controller/deploy.js', function() {
  var mk_log = deploy.__get__('mk_log');

  var log_dir = 'log/f2e';
  var log_file = 'test.log';
  var log_file_relative = path.join(log_dir, log_file);

  describe('.mk_log', function() {
    afterEach(function() {
      // 清理, 还原
      shell.exec('rm -rf log');
    });

    it('should create dir and file when not exists', function() {
      mk_log(log_dir, log_file);

      assert.isTrue(fs.existsSync(log_file_relative), '文件 log/f2e/test.log 存在');
    });

    it('should clear the file content when exists', function() {
      shell.exec('mkdir -p log/f2e');
      shell.exec('touch log/f2e/test.log');
      shell.exec('echo "this is content" > log/f2e/test.log');

      mk_log(log_dir, log_file);

      assert.lengthOf(fs.readFileSync(log_file_relative, { encoding: 'utf8' }), 0, '文件内容为空');
    });

    it('should throw error and message when mk dir failed', function() {
      shell.exec('touch log');

      assert.throws(mk_log.bind(null, log_dir, log_file), '创建日志目录' + log_dir + '失败');
    });

    it('should throw error and message when clear file content failed', function() {
      shell.exec('mkdir -p log/f2e/test.log');

      assert.throws(mk_log.bind(null, log_dir, log_file), '清空日志文件' + path.join(log_dir, log_file) + '失败');
    });
  });
});
