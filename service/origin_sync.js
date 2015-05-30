var path = require('path');
var shell = require('shelljs');

module.exports = function(src, dest_dir) {
  shell.exec('sudo mkdir -p ' + dest_dir);

  return shell.exec([
    'sudo cp -rf',
    src,
    dest_dir
  ].join(' '));
};
