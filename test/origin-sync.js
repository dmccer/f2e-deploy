var chai = require('chai');
var assert = chai.assert;

var path = require('path');
var shell = require('shelljs');

var config = require('../config');
var origin_sync = require('../service/origin-sync');
var Deploger = require('../service/deploger');

describe('service/origin-sync.js', function() {
  var built = {
    out_dir: 'deploy/alpha/f2e/demigod',
    repository: {
      owner: {
        username: 'f2e'
      }
    }
  };

  var pkg = {
    name: 'demigod',
    version: '0.0.0',
    dest: 'dist'
  };

  var dist = path.join(built.out_dir, pkg.dest);
  var cssfile = path.join(dist, 'test.css');
  shell.exec('mkdir -p ' + dist);
  shell.exec('touch ' + cssfile);
  shell.exec('echo "css content" > ' + cssfile);

  var logdir = 'log/f2e';
  var logfile = path.join(logdir, 'demigod.log');

  shell.exec('mkdir -p ' + logdir);
  shell.exec('touch ' + logfile);
  shell.exec('> ' + logfile);

  var deploger = new Deploger('log/f2e/demigod.log', 'origin_sync');

  describe('module.exports()', function() {
    var remote_group = path.resolve(config.static_server.alpha, built.repository.owner.username);
    var remote_dir = path.resolve(config.static_server.alpha, built.repository.owner.username, pkg.name);
    var dest_dir = path.join(remote_dir, pkg.version);

    afterEach(function() {
      deploger.removeAllListeners();
      shell.exec('sudo rm -rf ' + remote_group);
    });

    it('should throw error and msg when mkdir failed', function(done) {
      this.timeout(5000);

      shell.exec('sudo mkdir -p ' + remote_dir);
      shell.exec('sudo touch ' + dest_dir);

      assert.throws(origin_sync.bind(null, deploger, pkg, built), '创建静态服务器目录' + dest_dir + '失败');

      done();
    });

    it('should throw err and msg when copy file failed', function() {
      var listener = function() {
        shell.exec('sudo rm -rf ' + remote_dir);
      };
      deploger.on('after-mk-dest-dir', listener);

      assert.throws(origin_sync.bind(null, deploger, pkg, built), '拷贝待发布代码到静态服务器目录失败');
    });

    it('should return true when sync success', function() {
      assert.isTrue(origin_sync(deploger, pkg, built));
    });
  });
});
