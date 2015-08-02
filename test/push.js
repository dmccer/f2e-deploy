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

    var _update_repo = push.__get__('update_repo');

    afterEach(function() {
      push.__set__('update_repo', _update_repo);
    });

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

    it('should create repo & deployment when push event trigger with new repo', function(done) {
      request(app)
        .post('/alpha')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(push_data))
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          msg: 'Push 处理成功'
        }, done);
    });

    it('should throw error when update repo failed', function(done) {
      var err = new Error('update_repo error');
      var update_repo = function() {
        throw err;
      };

      push.__set__('update_repo', update_repo);

      request(app)
        .post('/alpha')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(push_data))
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500, {
          msg: 'Push 事件处理失败:' + err.message
        }, done);
    });
  });
});