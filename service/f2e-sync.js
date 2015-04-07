var path = require('path');
var shell = require('shelljs');

module.exports = function(src, dest_dir) {
  var output = shell.exec('sudo mkdir -p ' + dest_dir).output 
    + shell.exec([
      'sudo cp -rf',
      src,
      dest_dir
    ].join(' ')).output;

  console.log(src, dest_dir);
  
  return output;
};