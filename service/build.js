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

  deploger.emit('display-repos', {
    repos_name: repos_name,
    repos_url: repos_url,
    commit_id: commit_id,
    owner_name: owner_name
  });

  var tar_gz_url = [
    repos_url,
    'archive',
    commit_id + postfix
  ].join('/');

  var out_dir = path.resolve(dest, owner_name, repos_name);
  var out_file = out_dir + postfix;

  var mk_out_dir = shell.exec('mkdir -p ' + out_dir);
  if (mk_out_dir.code !== 0) {
    deploger.emit('mk-out-dir-err', {
      msg: '创建预处理目录失败: ' + out_dir,
      err: new Error(mk_out_dir.output)
    });

    return;
  }
  deploger.emit('after-mk-out-dir', outdir);

  var curl_repos = shell.exec([
    'curl -o',
    out_file,
    tar_gz_url
  ].join(' '));
  if (curl_repos.code !== 0) {
    deploger.emit('curl-repos-err', {
      msg: '下载源码失败: ' + tar_gz_url,
      err: new Error(curl_repos.output)
    });

    return;
  }
  deploger.emit('after-curl-repos', curl_repos.output, tar_gz_url, out_file);

  var unzip_repos = shell.exec(['tar zxvf', out_file, '-C', out_dir].join(' '));
  if (unzip_repos.code !== 0) {
    deploger.emit('unzip-repos-err', {
      msg: '解压' + out_file + ' 失败',
      err: new Error(unzip_repos.output)
    });

    return;
  }
  deploger.emit('after-unzip-repos', output, out_dir, out_file);

  // 进入目录 out_dir
  shell.cd(out_dir);

  var npm_prestart = shell.exec('npm run prestart');
  if (npm_prestart.code !== 0) {
    deploger.emit('npm-prestart-err', {
      msg: '编译失败: npm run prestart',
      err: new Error(npm_prestart.output)
    });

    return;
  }
  deploger.emit('after-npm-prestart', output, out_file);

  var rm_zip = shell.exec(['rm', '-rf', out_file].join(' '));
  if (rm_zip.code !== 0) {
    deploger.emit('rm-zip-err', {
      msg: '删除' + out_file + '失败',
      err: new Error(rm_zip.output)
    });

    return;
  }
  deploger.emit('after-rm-zip', out_file);

  return {
    out_dir: out_dir,
    repository: data.repository
  };
};
