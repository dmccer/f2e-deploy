var chai = require('chai');
var assert = chai.assert;

var path = require('path');
var shell = require('shelljs');

var config = require('../config');
var targz = require('../service/tar-gz');
var Deploger = require('../service/deploger');

describe('service/tar-gz.js', function() {
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

  var logdir = 'log/f2e';
  var logfile = path.join(logdir, 'demigod.log');

  shell.exec('mkdir -p ' + logdir);
  shell.exec('touch ' + logfile);
  shell.exec('> ' + logfile);

  var deploger = new Deploger('log/f2e/demigod.log', 'tar_gz');

  describe('module.exports()', function() {
    var remote_dir = path.resolve(config.static_server.alpha, built.repository.owner.username, pkg.name);
    var dest_dir = path.join(remote_dir, pkg.version);

    afterEach(function() {
      deploger.removeAllListeners();
    });

    it('should throw error and msg when tar compress failed', function() {
      shell.exec('sudo mv ' + dest_dir + ' ' + dest_dir + '_bak');
      assert.throws(targz.bind(null, deploger, built, pkg), '生成静态资源压缩包' + dest_dir + '.tar.gz失败');
      shell.exec('sudo mv ' + dest_dir + '_bak ' + dest_dir);
    });

    it('should stay at project root dir after targz complete', function() {
      targz(deploger, built, pkg);
      assert.equal(process.cwd(), config.root, 'yes, stay at project root');
    });

    it('should return trun when complete compress tar.gz', function() {
      assert.isTrue(targz(deploger, built, pkg));
    });
  });

});
