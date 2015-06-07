var chai = require('chai');
var assert = chai.assert;

var config = require('../config');
var authorize = require('../service/authorization');

describe('service/authorizatioin.js', function() {
  describe('.check()', function() {
    it('should return false when secret incorrect', function() {
      assert.isFalse(authorize.check('incorrect secret'));
    });

    it('should return true when secret correct', function() {
      assert.isTrue(authorize.check(config.default_secret));
    });
  });
});
