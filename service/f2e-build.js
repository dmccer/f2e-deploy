var shell = require('shelljs');
var path = require('path');

module.exports = function(data, dest) {
  if (!data || !data.commits.length) {
    return;
  }

  var commit_id = data.commits[0].id;
  var repos_url = data.repository.url;
  var repos_name = data.repository.name;
  var postfix = '.tar.gz';

  console.log('repo info:')
  console.log('commits id: ', commit_id);
  console.log('work path: ', dest);
  
  var tar_gz_url = [
    repos_url,
    'archive',
    data.commits.id + postfix
  ].join('/');
  
  var out_file = path.resolve(dest, repos_name + postfix);

  var log = shell.exec('mkdir -p ' + dest).output
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
