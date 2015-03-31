var path = require('path');
var shell = require('shelljs');

module.exports = function(proj_dir, static_server) {
  var pkg = require(path.resolve(proj_dir, pkg.name, './package.json'));
  var deploy_dir = path.resolve(static_server, pkg.name, pkg.version);

  console.log(proj_dir, pkg.name, pkg.version, pkg.dest);

  return shell.exec('sudo mkdir -p ' + deploy_dir).output 
    + shell.exec([
      'sudo cp -rf',
      path.resolve(proj_dir, pkg.dest, './*'),
      deploy_dir
    ].join(' ')).output;
};