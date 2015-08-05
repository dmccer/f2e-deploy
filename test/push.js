/**
 * Created by Kane on 15/8/2.
 */
var path = require('path');
var request = require('supertest');
var rewire = require('rewire');
var express = require('express');
var bodyParser = require('body-parser');

var push = rewire('../controller/push');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('../db');

describe('contoller/push.js', function() {
  describe('module.exports()', function() {
    app.post('/alpha', push);

    var push_data = {
      ref: 'refs/heads/master',
      commits: [{
        id: '5f69e7cedd45fcce5ea8f3116e9e20f15e90dafb',
        message: 'hi',
        url: 'http://localhost:3000/unknwon/macaron/commit/5f69e7cedd45fcce5ea8f3116e9e20f15e90dafb',
        author: {
          "name": "Unknwon",
          "email": "joe2010xtmf@163.com",
          "username": "Unknwon"
        }
      }],
      "repository": {
        "id": 1,
        "name": "macaron",
        "url": "http://localhost:3000/unknwon/macaron",
        "description": "描述",
        "website": "http://guluabc.com",
        "watchers": 1,
        "owner": {
          "name": "k",
          "email": "k@163.com",
          "username": "K"
        },
        "private": false
      },
      "pusher": {
        "name": "Unknwon",
        "email": "joe2010xtmf@163.com",
        "username": "unknwon"
      },
      "before": "f22f45d79a2ff050f0250a7df41f4944e6591853",
      "after": "5f69e7cedd45fcce5ea8f3116e9e20f15e90dafb",
      "compare_url": "http://localhost:3000/unknwon/macaron/compare/f22f45d79a2ff050f0250a7df41f4944e6591853...5f69e7cedd45fcce5ea8f3116e9e20f15e90dafb"
    };

    function trigger_push() {
      return request(app)
        .post('/alpha')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(push_data))
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/);
    }

    function throw_err(err) {
      return function() {
        throw err;
      }
    }

    var _update_repo = push.__get__('update_repo');
    var _build_deploy_data = push.__get__('build_deploy_data');
    var _update_deployment = push.__get__('update_deployment');

    afterEach(function() {
      push.__set__('update_repo', _update_repo);
      push.__set__('build_deploy_data', _build_deploy_data);
      push.__set__('update_deployment', _update_deployment);
    });

    it('should create repo & deployment when push event trigger with new repo', function(done) {
      trigger_push()
        .expect(200, {
          msg: 'Push 处理成功'
        }, done);
    });

    it('should throw error when update repo failed', function(done) {
      var err = new Error('update_repo error');
      push.__set__('update_repo', throw_err(err));

      trigger_push()
        .expect(500, {
          msg: 'Push 事件处理失败:' + err.message
        }, done);
    });

    it('should throw error when build_deploy_data failed', function(done) {
      var err = new Error('build_deploy_data error');
      push.__set__('build_deploy_data', throw_err(err));

      trigger_push()
        .expect(500, {
          msg: 'Push 事件处理失败:' + err.message
        }, done);
    });

    it('should throw error when update_deployment failed', function(done) {
      var err = new Error('update_deployment error');
      push.__set__('update_deployment', throw_err(err));

      trigger_push()
        .expect(500, {
          msg: 'Push 事件处理失败:' + err.message
        }, done);
    });
  });
});