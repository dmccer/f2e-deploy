var shell = require('shelljs');
var path = require('path');
var deploger = require('./deploger');

module.exports = function(data, dest) {
  if (!data || !data.commits.length) {
    deploger.emit('build-param-err', {
      msg: '缺少 commit 信息',
      err: new Error('missing build params: commit')
    });

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

  var out_dir = path.resolve(dest, owner_name, repos_name);
  var out_file = out_dir + postfix;

  var mk_out_dir = shell.exec('mkdir -p ' + out_dir);
  if (mk_out_dir.code !== 0) {
    logger.fatal('创建预处理目录失败: ' + out_dir);
    logger.info('错误信息:\n' + mk_out_dir.output);

    return;
  }
  logger.info('创建预处理目录成功: ' + out_dir);


  logger.info('正在下载项目源码...');
  var curl_repos = shell.exec([
    'curl -o',
    out_file,
    tar_gz_url
  ].join(' '));
  if (curl_repos.code !== 0) {
    logger.fatal('下载项目源码失败: ' + tar_gz_url);
    logger.info('错误信息:\n' + curl_repos.output);

    return;
  }
  logger.info(curl_repos.output);
  logger.info('下载项目源码成功');


  logger.info('正在解压' + out_file);
  var unzip_repos = shell.exec(['tar zxvf', out_file, '-C', out_dir].join(' '));
  if (unzip_repos.code !== 0) {
    logger.fatal('解压' + out_file + ' 失败');
    logger.info('错误信息:\n' + unzip_repos.output);

    return;
  }
  logger.info(unzip_repos.output);
  logger.info('解压' + out_file + '完成');

  // 进入目录 out_dir
  shell.cd(out_dir);

  logger.info('正在编译...');
  var npm_prestart = shell.exec('npm run prestart');
  if (npm_prestart.code !== 0) {
    logger.fatal('编译失败: npm run prestart');
    logger.info('错误信息:\n' + npm_prestart.output);

    return;
  }
  logger.info(npm_prestart.output);
  logger.info('编译成功');


  logger.info('正在删除' + out_file + '...');
  var rm_zip = shell.exec(['rm', '-rf', out_file].join(' '));
  if (rm_zip.code !== 0) {
    logger.fatal('删除' + out_file + '失败');
    logger.info('错误信息:\n' + rm_zip.output);

    return;
  }
  logger.info('删除' + out_file + '成功');

  return {
    out_dir: out_dir,
    repository: data.repository
  };
};
