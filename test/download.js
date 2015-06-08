var chai = require('chai');
var assert = chai.assert;

var path = require('path');
var shell = require('shelljs');
var rewire = require('rewire');
var request = require('supertest');
var express = require('express');

var config = require('../config');
var Deploger = require('../service/deploger');
var download = rewire('../controller/download');

var app = express();

describe('controller/download.js', function() {
  var deploger_factory = download.__get__('deploger_factory');
  var deploger = deploger_factory();

  var deploger_factory_proxy = function() {
    return deploger;
  };

  // download.__set__('deploger_factory', deploger_factory_proxy);

  var owner = 'f2e';
  var name = 'demigod';
  var work_dir = path.join(config.alpha_work_path, owner, name);
  var remote_dir = path.join(config.static_server.alpha, owner, name);

  describe('module.exports()', function(done) {
    app.get('/alpha/:name', download);

    var pkgfile = path.join(work_dir, 'package.json');
    before(function() {
      shell.exec('mkdir -p ' + work_dir);
      shell.exec('touch ' + pkgfile);
      shell.exec('echo \'{\"version\": \"0.0.0\"}\' > ' + pkgfile);

      shell.exec('sudo mkdir -p ' + remote_dir);
      shell.exec('sudo touch ' + path.join(remote_dir, '0.0.0.tar.gz'));
    });

    after(function() {
      shell.exec('rm -rf ' + path.join(config.alpha_work_path, owner));
      shell.exec('sudo rm -rf ' + path.join(config.static_server.alpha, owner));
    });

    it('should return err msg when params invalid', function(done) {
      request(app)
        .get('/alpha/' + name)
        .expect('Content-Type', /json/)
        .expect(200, {
          data: 'owner或name不能为空'
        }, done)
      ;
    });

    it('should return err msg when workdir not exists', function(done) {
      shell.exec('mv  ' + work_dir + ' ' + work_dir + '_bak');

      request(app)
        .get('/alpha/' + name + '?owner=' + owner)
        .expect('Content-Type', /json/)
        .expect(200, {
          data: owner + '/' + name + '项目不存在或从未发布'
        }, function() {
          shell.exec('mv ' + work_dir + '_bak ' + work_dir);
          done();
        });
    });

    it('should return err msg when target version not exists', function(done) {
      this.timeout(20000);
      shell.exec('sudo mv ' + remote_dir + ' ' + remote_dir + '_bak');

      request(app)
        .get('/alpha/' + name + '?owner=' + owner)
        .expect('Content-Type', /json/)
        .expect(200, {
          data: owner + '/' + name + '项目从未发布成功'
        }, function() {
          shell.exec('sudo mv ' + remote_dir + '_bak ' + remote_dir);
          done();
        });
    });

    it('should return err msg when download failed', function(done) {
      this.timeout(20000);

      request(app)
        .get('/alpha/' + name + '?owner=' + owner)
        .expect('Content-Type', /octet-stream/)
        .expect(200, done);
    });
  });
});
