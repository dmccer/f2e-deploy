var shell = require('shelljs');
var path = require('path');
var log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' },
    {
      type: 'file',
      filename: 'log/express.log',
      category: 'publish'
    }
  ]
});

var logger = log4js.getLogger('publish');


module.exports = function(data, dest) {
  if (!data || !data.commits.length) {
    logger.fatal('缺少 commit 信息');
    return;
  }

  var commit_id = data.commits[0].id;
  var repos_url = data.repository.url;
  var repos_name = data.repository.name;
  var owner_name = data.repository.owner.username;
  var postfix = '.tar.gz';

  logger.info('项目 git repos 信息:');
  logger.info('repos name: ' + repos_name);
  logger.info('repos url: ' + repos_url);
  logger.info('commit id: ' + commit_id);
  logger.info('owner name: ' + owner_name);

  var tar_gz_url = [
    repos_url,
    'archive',
    commit_id + postfix
  ].join('/');

  var out_dir = path.resolve(dest, repos_name);
  var out_file = out_dir + postfix;
  var log = '';

  log = shell.exec('mkdir -p ' + out_dir).output;
  logger.info('创建预处理目录成功: ' + out_dir);

  logger.info('正在下载项目源码...');
  log += shell.exec([
    'curl -o',
    out_file,
    tar_gz_url
  ].join(' ')).output;
  logger.info('下载项目源码成功');

  logger.info('正在解压源码');
  log += shell.exec(['tar zxvf', out_file, '-C', out_dir].join(' ')).output;
  logger.info('解压源码完成');

  shell.cd(out_dir);
  logger.info('正在编译...');
  log += shell.exec('npm run prestart');
  logger.info('编译完成');

  return {
    out_dir: out_dir,
    repository: data.repository,
    log: log
  };
};
