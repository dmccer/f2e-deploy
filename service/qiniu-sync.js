var path = require('path');
var shell = require('shelljs');
var config = require('../config');

module.exports = function() {
  var qconf_json = jf.readFileSync(config.qiniu);
  qconf_json.src = config.static_server.alpha;
  js.writeFileSync(config.qiniu, qconf_json);

  var output = shell.exec('qrsync ' + config.qiniu).output;

  console.log(dest_dir);
  
  return output;
};