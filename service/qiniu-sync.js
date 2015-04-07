var path = require('path');
var shell = require('shelljs');
var config = require('../config');
var jf = require('jsonfile');

module.exports = function() {
  var qconf_json = jf.readFileSync(config.qiniu);
  qconf_json.src = config.static_server.alpha;
  jf.writeFileSync(config.qiniu, qconf_json);

  var output = shell.exec('qrsync ' + config.qiniu).output;

  console.log('上传七牛成功');
  
  return output;
};