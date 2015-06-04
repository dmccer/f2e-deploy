var chai = require('chai');
var assert = chai.assert;

var path = require('path');
var url = require('url');
var fs = require('fs');
var rewire = require('rewire');
var shell = require('shelljs');

var builder = require('../service/build');
var Deploger = require('../service/deploger');

describe('service/build.js', function() {
  var data = {
    commits: [{
      id: '5f69e7cedd45fcce5ea8f3116e9e20f15e90dafb'
    }],
    repository: {
      name: 'test',
      url: 'http://git.guluabc.com/f2e/test',
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

    before(function() {
      shell.exec('mkdir -p log');
      shell.exec('touch log/deploy.log');
      shell.exec('> log/deploy.log');

      deploger = new Deploger('log/deploy.log', 'deploy');
    });


    it('should throw error and msg when data is empty', function() {
      assert.throws(builder.bind(null, deploger, {}, dest), '缺少 commit 信息');
    });
  });

  describe('.build()', function() {

  });

});
