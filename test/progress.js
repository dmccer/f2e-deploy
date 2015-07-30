/**
 * Created by Kane on 15/7/30.
 */
var path = require('path');
var shell = require('shelljs');
var request = require('supertest');
var express = require('express');

var progresor = require('../controller/progress');

var app = express();

describe('controller/progress.js', function() {
  var owner = 'f2e';
  var name = 'demigod-tester';

  describe('module.exports()', function() {
    app.get('/alpha/:name/progress', progresor);

    it('should return 100 when repos is f2e/demigod-tester', function(done) {
      request(app)
        .get('/alpha/demigod-tester/progress?owner=f2e')
        .expect('Content-Type', /json/)
        .expect(200, {
          progress: 100
        }, done);
    });

    it('should return 0 when repos is f2e/null', function(done) {
      request(app)
        .get('/alpha/null/progress?owner=f2e')
        .expect('Content-Type', /json/)
        .expect(500, {
          msg: '没有找到该项目'
        }, done);
    });

    it('should return fail when repos is f2e/kane', function(done) {
      request(app)
        .get('/alpha/test/progress?owner=f2e')
        .expect('Content-Type', /json/)
        .expect(200, {
          fail: true
        }, done);
    });
  });
});