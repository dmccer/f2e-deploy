var shell = require('shelljs');
var path = require('path');
var _ = require('lodash');
var config = require('../config');
var Deploger = require('./deploger');

module.exports = function(data, dest) {
  validate(new Deploger('log/deploy.log', 'deploy'), data, dest);

  var repos_name = data.repository.name;
  var owner_name = data.repository.owner.username;
  var deploger = new Deploger(path.join('log', owner_name, repos_name), 'build');

  build_log_listener(deploger);

  var out_dir = build(deploger, data, dest);

  return {
    out_dir: out_dir,
    repository: data.repository
  };
};

function build(deploger, data, dest) {
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

  var err, err_msg;

  var mk_out_dir = shell.exec('mkdir -p ' + out_dir);
  if (mk_out_dir.code !== 0) {
    err_msg = '创建预处理目录' + out_dir + '失败';
    err = new Error(err_msg);

    deploger.emit('mk-out-dir-err', {
      msg: err_msg,
      err: err
    });

    throw err;
  }
  deploger.emit('after-mk-out-dir', out_dir);

  var curl_repos = shell.exec([
    'curl -o',
    out_file,
    tar_gz_url
  ].join(' '));
  if (curl_repos.code !== 0) {
    err_msg = '下载' + tar_gz_url + '失败';
    err = new Error(err_msg);

    deploger.emit('curl-repos-err', {
      msg: '下载' + tar_gz_url + '失败',
      err: new Error(curl_repos.output)
    });

    throw err;
  }
  deploger.emit('after-curl-repos', curl_repos.output, tar_gz_url, out_file);

  var unzip_repos = shell.exec(['tar zxvf', out_file, '-C', out_dir].join(' '));
  if (unzip_repos.code !== 0) {
    err_msg = '解压' + out_file + '失败';
    err = new Error(err_msg);
    deploger.emit('unzip-repos-err', {
      msg: err_msg,
      err: new Error(unzip_repos.output)
    });

    throw err;
  }
  deploger.emit('after-unzip-repos', unzip_repos.output, out_dir, out_file);

  // 进入目录 out_dir
  shell.cd(out_dir);

  var npm_prestart = shell.exec('npm run prestart');
  shell.cd(config.root);
  if (npm_prestart.code !== 0) {
    err_msg = '编译失败: npm run prestart';
    err = new Error(err_msg);

    deploger.emit('npm-prestart-err', {
      msg: err_msg,
      err: new Error(npm_prestart.output)
    });

    throw err;
  }
  deploger.emit('after-npm-prestart', npm_prestart.output, out_file);

  var rm_zip = shell.exec(['rm', '-rf', out_file].join(' '));
  if (rm_zip.code !== 0) {
    err_msg = '删除' + out_file + '失败';
    err = new Error(err_msg);
    deploger.emit('rm-zip-err', {
      msg: err_msg,
      err: new Error(rm_zip.output)
    });

    throw err;
  }
  deploger.emit('after-rm-zip', out_file);

  return out_dir;
}

function validate(deploger, data, dest) {
  var err, err_msg;

  if (!data) {
    err_msg = '未传入参数';
  } else if (!data.commits || !data.commits.length) {
    err_msg = '参数缺少 commits 字段信息';
  } else if (!data.repository || !data.repository.name || !data.repository.owner || !data.repository.owner.username || _.trim(data.repository.name) === '' || _.trim(data.repository.owner.username) === '') {
    err_msg = '参数缺少 repository 字段信息';
  }

  if (err_msg) {
    err = new Error(err_msg);

    deploger.emit('build-param-err', {
      msg: err_msg,
      err: err
    });

    throw err;
  }

  return true;
}

function build_log_listener(deploger) {
  var logger = deploger.logger;
  var errHandler = deploger.errHandler;

  deploger
    .on('before-build', function() {
      logger.trace('正在预处理静态资源...');
    })
    .on('build-param-err', errHandler)
    .on('display-repos', function(data) {
      logger.info('项目 git repos 信息:');
      logger.info('repos name: ' + data.repos_name);
      logger.info('repos url: ' + data.repos_url);
      logger.info('commit id: ' + data.commit_id);
      logger.info('owner name: ' + data.owner_name);
    })
    .on('mk-out-dir-err', errHandler)
    .on('after-mk-out-dir', function(outdir) {
      logger.info('创建预处理目录成功: ' + outdir);
      logger.trace('正在下载项目源码...');
    })
    .on('curl-repos-err', errHandler)
    .on('after-curl-repos', function(output, tar_gz_url, outfile) {
      logger.info(output);
      logger.info('下载' + tar_gz_url + '源码成功');
      logger.trace('正在解压' + outfile);
    })
    .on('unzip-repos-err', errHandler)
    .on('after-unzip-repos', function(output, outdir, outfile) {
      logger.info(output);
      logger.info('解压' + outfile + '完成');
      logger.trace('进入目录' + outdir);
      logger.trace('正在编译...');
    })
    .on('npm-prestart-err', errHandler)
    .on('after-npm-prestart', function(output, outfile) {
      logger.info(output);
      logger.info('编译成功');
      logger.info('正在删除' + outfile + '...');
    })
    .on('rm-zip-err', errHandler)
    .on('after-rm-zip', function(outfile) {
      logger.info('删除' + outfile + '成功');
    })
    .on('build-err', errHandler)
    .on('after-build', function() {
      logger.info('预处理静态资源完成');
    })
  ;
}

