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
      id: '8d06a3c48f8a22e94263fdd36298b6cfabc5c201'
    }],
    repository: {
      name: 'demigod',
      url: 'http://git.guluabc.com/f2e/demigod',
      owner: {
        username: 'f2e'
      }
    }
  };

  var dest = 'deploy/alpha';

  var log_dir = path.join('log', data.repository.owner.username);
  var log_file = data.repository.name + '.log';
  var log_file_relative = path.join(log_dir, log_file);

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

    var out_parent_dir = path.join(dest, data.repository.owner.username);
    var outdir = path.resolve(out_parent_dir, data.repository.name);
    var outfile = outdir + '.tar.gz';

    before(function() {
      shell.exec('mkdir -p ' + log_dir);
      shell.exec('touch ' + log_file_relative);
      shell.exec('> ' + log_file_relative);

      deploger = new Deploger(log_file_relative, 'build');
    });

    it('should throw error and msg when mkdir failed', function(done) {
      this.timeout(10000);

      shell.exec('rm -rf ' + out_parent_dir);
      shell.exec('mkdir -p ' + out_parent_dir);
      shell.exec('touch ' + outdir);

      assert.throws(build.bind(null, deploger, data, dest), '创建预处理目录' + outdir + '失败');

      shell.exec('rm -rf ' + out_parent_dir);

      done();
    });

    it('should throw error and msg when curl repos failed', function() {
      var url = data.repository.url;
      data.repository.url = 'https://git.guluabc.com';

      assert.throws(build.bind(null, deploger, data, dest), '下载' + [data.repository.url, 'archive', data.commits[0].id + '.tar.gz'].join('/') + '失败');

      data.repository.url = url;
    });

    it('should throw error and msg when tar failed', function() {
      var listener = function(output, targz_url, outfile) {
        shell.exec('mv ' + outfile + ' ' + outfile + '.bak');
      };
      deploger.on('after-curl-repos', listener);

      assert.throws(build.bind(null, deploger, data, dest), '解压' + outfile + '失败');

      shell.exec('mv ' + outfile + '.bak ' + outfile);
      deploger.removeListener('after-curl-repos', listener);
    });

    it('should throw error when compile failed', function() {
      var listener = function(output, outdir, outfile) {
        shell.exec('mv ' + outdir + '/package.json' + ' ' + outdir + '/package.json.bak');
      };
      deploger.on('after-unzip-repos', listener);

      assert.throws(build.bind(null, deploger, data, dest), '编译失败: npm run prestart');

      shell.exec('mv ' + outdir + '/package.json.bak' + ' ' + outdir + '/package.json');
      deploger.removeListener('after-unzip-repos', listener);
    });

    it('should return correct outdir when build complete', function(done) {
      this.timeout(1200000);

      assert.equal(build(deploger, data, dest), outdir, 'returned correct outdir');

      done();
    });

  });

});
