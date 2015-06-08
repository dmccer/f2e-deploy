var path = require('path');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Deploger(file, category) {
  EventEmitter.call(this);

  this.logger = require('../logger')(file, category);
}

util.inherits(Deploger, EventEmitter);

Deploger.prototype.errHandler = function(data) {
  this.logger.fatal(data.msg);
  this.logger.info(data.err.message);
};

module.exports = Deploger;
