var chai = require('chai');
var assert = chai.assert;

var path = require('path');
var url = require('url');
var fs = require('fs');
var rewire = require('rewire');
var shell = require('shelljs');

var builder = rewire('../service/build');
var Deploger = require('../service/deploger');

describe('service/build.js', function() {
  var data = {
    commits: [{
      id: '5f69e7cedd45fcce5ea8f3116e9e20f15e90dafb'
    }],
    repository: {
      name: 'itest',
      url: 'https://git.guluabc.com/f2e/itest',
      owner: {
        username: 'f2e'
      }
    }
  };

  var dest = 'deploy/alpha';

  var log_dir = path.join('log', data.repository.owner.username);
  var log_file = data.repository.name + '.log';
  var log_file_relative = path.join(log_dir, log_file);

  describe('module.exports', function() {
  });

  describe('.validate()', function() {
    var deploger;
    var validate = builder.__get__('validate');

    before(function() {
      shell.exec('mkdir -p log');
      shell.exec('touch log/deploy.log');
      shell.exec('> log/deploy.log');

      deploger = new Deploger('log/deploy.log', 'deploy');
    });


    it('should throw error and msg when data is empty', function() {
      assert.throws(validate.bind(null, deploger, null, dest), '未传入参数');
    });

    it('should throw error and msg when data has no commits info', function() {
      assert.throws(validate.bind(null, deploger, {}, dest), '参数缺少 commits 字段信息');
    });

    it('should throw error and msg when data has no repository info', function() {
      assert.throws(validate.bind(null, deploger, {
        commits: [{
          id: '5f69e7cedd45fcce5ea8f3116e9e20f15e90dafb'
        }]
      }), '参数缺少 repository 字段信息');
    });

    it('should return true when data is valid', function() {
      assert.isTrue(validate(deploger, data, dest));
    });
  });

  describe('.build()', function() {
    var deploger;
    var build = builder.__get__('build');

    before(function() {
      shell.exec('mkdir -p ' + log_dir);
      shell.exec('touch ' + log_file_relative);
      shell.exec('> ' + log_file_relative);

      deploger = new Deploger(log_file_relative, 'build');
    });

    it('should throw error and msg when mkdir failed', function() {
      var out_parent_dir = path.join(dest, data.repository.owner.username);
      var outdir = path.resolve(out_parent_dir, data.repository.name);

      shell.exec('rm -rf ' + out_parent_dir);
      shell.exec('mkdir -p ' + out_parent_dir);
      shell.exec('touch ' + outdir);

      assert.throws(build.bind(null, deploger, data, dest), '创建预处理目录' + outdir + '失败');

      shell.exec('rm -rf ' + out_parent_dir);
    });

    it('should throw error and msg when curl repos failed', function() {
      assert.throws(build.bind(null, deploger, data, dest), '下载' + [data.repository.url, 'archive', data.commits[0].id + '.tar.gz'].join('/') + '失败');
    });

  });

});
