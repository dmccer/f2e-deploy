var chai = require('chai');
var assert = chai.assert;

var path = require('path');
var url = require('url');
var rewire = require('rewire');
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

  shell.exec('mkdir -p log/f2e');
  shell.exec('touch log/f2e/demigod.log');
  shell.exec('> log/f2e/demigod.log');

  var deploger = new Deploger('log/f2e/demigod.log', 'origin_sync');

  describe('module.exports', function() {
    it('should throw error and msg when mkdir failed', function() {
      var remote_dir = path.resolve(config.static_server.alpha, built.repository.owner.username, pkg.name);
      var dest_dir = path.join(remote_dir, pkg.version);

      shell.exec('sudo mkdir -p ' + remote_dir);
      shell.exec('sudo touch ' + dest_dir);

      assert.throws(origin_sync.bind(null, deploger, pkg, built), '创建静态服务器目录' + dest_dir + '失败');

      shell.exec('sudo rm -rf ' + remote_dir);
    });
  });
});
