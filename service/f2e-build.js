var shell = require('shelljs');
var path = require('path');

module.exports = function(data, dest) {
  console.log('repo info:')
  console.log('commits id: ', data.commits.id);
  console.log('work path: ', dest);

  var postfix = '.tar.gz';
  var tar_gz_url = [
    data.repository.url,
    'archive',
    data.commits.id + postfix
  ].join('/');
  
  var out_file = path.resolve(dest, repository.name + postfix);

  var log = shell.exec('sudo mkdir -p ' + dest).output
  + shell.exec([
    'curl -o',
    out_file,
    tar_gz_url
  ].join(' ')).output

  + shell.exec('tar zxvf ' + out_file).output
  + shell.cd(out_file).output
  + shell.exec('npm run prestart');

  return {
    out_file: out_file,
    log: log
  };
}
