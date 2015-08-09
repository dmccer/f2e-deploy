/**
 * 部署静态项目
 * @author Kane yunhua.xiao@guluauto.com
 * @module service/deploy
 */
var path = require('path');
var config = require('../config');
var shell = require('shelljs');
var deployment = require('../model/deployment');

// args: repo_id, name, username, url, branch, after, suffix, env
var default_args = {
  suffix: '.tar.gz'
};

function Deployer(args) {
  Object.assign(this.args = {}, default_args, args);
  this.validate();
}

Deployer.prototype.validate = function() {
  var keys = Object.keys(this.args);
  var pass = keys.every(function(key) {
    var val = this.args[key];

    return val != null && val !== '';
  }.bind(this));

  if (!pass) {
    var err = new Error('缺少参数: ' + keys.join());

    throw err;
  }

  return true;
}

Deployer.prototype.step = function(progress, status, version) {
  var self = this;
  var data = {
    progress: progress
  };

  if (status != null) {
    data.status = status;
  }

  if (version != null) {
    data.version = version;
  }

  return function(resolve, reject) {
    deployment.update({
      repo_id: self.args.repo_id,
      branch: self.args.branch,
      env: self.args.env
    }, data, function(err) {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  }
}

Deployer.prototype.run = function() {
  return this.prepare()
    .then(this.fetch.bind(this))
    .then(this.build.bind(this))
    .then(this.read_pkg.bind(this))
    .then(this.sync_server.bind(this))
    .then(this.sync_qiniu.bind(this))
    .then(this.update_version.bind(this))
    .then(function() {
      return new Promise(this.step(6, null, this.pkg.version));
    }.bind(this))
    .then(this.generate_tar_gz.bind(this));
}

Deployer.prototype.prepare = function() {
  this.out_dir = path.resolve(config[this.args.env].work_path, this.args.username, this.args.name);

  var err, err_msg;
  var mk_out_dir = shell.exec('mkdir -p ' + this.out_dir);
  if (mk_out_dir.code !== 0) {
    err_msg = '创建预处理目录' + out_dir + '失败';
    err = new Error(err_msg);

    throw err;
  }

  return new Promise(this.step(1, 1));
}

Deployer.prototype.fetch = function() {
  this._tar_gz_file = this.out_dir + this.suffix;

  var tar_gz_url = [
    this.args.url,
    'archive',
    this.args.after + this.args.suffix
  ].join('/');

  var err, err_msg;
  var curl_repo = shell.exec([
    'curl -o',
    this._tar_gz_file,
    tar_gz_url
  ].join(' '));
  if (curl_repo.code !== 0) {
    err_msg = '下载' + tar_gz_url + '失败';
    err = new Error(err_msg);

    throw err;
  }

  return new Promise(this.step(2));
}

Deployer.prototype.build = function() {
  var err, err_msg;

  var unzip_repos = shell.exec(['tar zxvf', this._tar_gz_file, '-C', this.out_dir].join(' '));
  if (unzip_repos.code !== 0) {
    err_msg = '解压' + out_file + '失败';
    err = new Error(err_msg);

    throw err;
  }

  // 进入目录 out_dir
  shell.cd(this.out_dir);

  var npm_prestart = shell.exec('npm run prestart');
  shell.cd(config.root);
  if (npm_prestart.code !== 0) {
    err_msg = '编译失败: npm run prestart';
    err = new Error(err_msg);

    throw err;
  }

  var rm_zip = shell.exec(['rm', '-rf', this._tar_gz_file].join(' '));
  if (rm_zip.code !== 0) {
    err_msg = '删除' + this._tar_gz_file + '失败';
    err = new Error(err_msg);

    throw err;
  }

  return new Promise(this.step(3));
}

Deployer.prototype.read_pkg = function() {
  this._pkg_json_file = path.resolve(this.out_dir, './package.json');
  require.cache[this._pkg_json_file] = null;
  this.pkg = require(this._pkg_json_file);
  // 静态资源服务器的目录(含资源版本)
  this.dest_dir = path.resolve(config[this.args.env].static_server, this.args.username, this.args.name, this.pkg.version);

  return;
}

Deployer.prototype.sync_server = function() {
  // 项目 build 之后的文件位置
  var src = path.resolve(this.out_dir, this.pkg.dest, './*');

  var err, err_msg;
  var mk_dest_dir = shell.exec('sudo mkdir -p ' + dest_dir);
  if (mk_dest_dir.code !== 0) {
    err_msg = '创建静态服务器目录' + dest_dir + '失败';
    err = new Error(err_msg);

    throw err;
  }

  var sync_src = shell.exec([
    'sudo cp -rf',
    src,
    this.dest_dir
  ].join(' '));
  if (sync_src.code !== 0) {
    err_msg = '拷贝待发布代码到静态服务器目录失败';
    err = new Error(err_msg);

    throw err;
  }

  return new Promise(this.step(4));
}

Deployer.prototype.sync_qiniu = function() {
  // alpha 和 pre 环境不需要同步七牛
  if (this.args.env !== 'prd') {
    return new Promise(this.step(5));
  }

  var err, err_msg;

  try {
    var qconf_json = jf.readFileSync(config.qiniu);
    qconf_json.src = config[this.args.env].static_server;
    jf.writeFileSync(config.qiniu, qconf_json);
  } catch(e) {
    err_msg = '更新七牛配置文件' + config.qiniu + '失败';
    err = new Error(err_msg);

    throw err;
  }

  var qrsync = shell.exec('qrsync ' + config.qiniu);

  if (qrsync.output.indexOf('failed') !== -1) {
    err_msg = '同步静态项目到七牛服务器失败';
    err = new Error(err_msg);

    throw err;
  }

  return new Promise(this.step(5));
}

Deployer.prototype.update_version = function() {
  var _url = url.resolve(config[this.args.env].vermgr.url, 'repos/' + this.args.name);

  var opt = {
    method: 'POST',
    url: _url,
    form: {
      owner: this.args.username,
      version: this.pkg.version,
      url: this.args.url,
      download: _.template(config[this.args.env].download_url)({
        name: this.args.name,
        owner: this.args.username
      })
    },
    headers: {
      Authorization: config[this.args.env].vermgr.authorization
    }
  };

  return new Promise(function (resolve, reject) {
    request(opt, function(err, res, body) {
      var error;

      if (!err && res.statusCode == 200) {
        console.log(JSON.parse(body));
      } else {
        error = new Error('写入版本到数据库失败');
      }

      if (error) {
        return reject(error);
      }

      resolve();
    });
  });
}

Deployer.prototype.generate_tar_gz = function() {
  // 静态资源服务器的目录(含资源版本)
  var tar_gz_file = this.dest_dir + this.args.suffix;

  shell.cd(path.dirname(this.dest_dir));

  var err_msg, err;
  var tar_gz_tip_prefix = '生成静态资源压缩包' + tar_gz_file;
  var tar_gz = shell.exec('sudo tar -czvf ' + this.pkg.version + this.args.suffix + ' ' + this.pkg.version);
  shell.cd(config.root);
  if (tar_gz.code !== 0) {
    err_msg = tar_gz_tip_prefix + '失败';
    err = new Error(err_msg);

    throw err;
  }

  return new Promise(this.step(7, 0));
}

module.exports = Deployer;