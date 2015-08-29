/**
 * @file 发布静态项目，详见 {@link http://github.com|发布流程图}
 * @author Kane yunhua.xiao@guluauto.com
 */
var path = require('path');
var url = require('url');
var shell = require('shelljs');
var request = require('request');
var _ = require('lodash');
var config = require('../config');
var deployment = require('../model/deployment');

/**
 * @desc 默认参数
 * @static
 * @private
 * @default
 */
var default_args = {
  suffix: '.tar.gz'
};

/**
 * FE 项目发布器
 * @class Deployer
 * @example
 *
 * var deployer = new Deployer({
 *    repo_id: String,
 *    name: String,
 *    username: String,
 *    url: String,
 *    branch: String,
 *    after: String,
 *    env: String,
 *    suffix: String, // 可选
 * });
 *
 * deployer
 *    .run()
 *    .then(function() {
 *      // success handle
 *    })
 *    .catch(e) {
 *      // error handle
 *    }
 *
 * @param {Object} args 发布所需参数
 * @param {string} args.repo_id 详见 {@link module:model/Repo~repo#_id}
 * @param {string} args.name 详见 {@link module:model/Repo~repo#name}
 * @param {string} args.username 详见 {@link module:model/Repo~repo#owner#username}
 * @param {string} args.url 详见 {@link module:model/Repo~repo#url}
 * @param {string} args.branch 详见 {@link module:model/Deployment~deployment#branch}
 * @param {string} args.after 详见 {@link module:model/Deployment~deployment#after}
 * @param {string} suffix 项目源码压缩包后缀名
 * @param {string} env 详见 {@link module:model/Deployment~deployment#env#alias}
 * @constructor
 */
function Deployer(args) {
  _.extend(this.args = {}, default_args, args);
  this.validate();
}

/**
 * @method validate
 * @desc 验证参数是否合规
 * @returns {boolean}
 */
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

/**
 * @method run
 * @desc 启动发布
 * @returns {Promise}
 */
Deployer.prototype.run = function() {
  return new Promise(function(resolve, reject) {
    try {
      resolve(this.prepare());
    } catch (err) {
      reject(err);
    }
  }.bind(this))
    .then(this.fetch.bind(this))
    .then(this.read_pkg.bind(this))
    .then(this.build.bind(this))
    .then(this.sync_server.bind(this))
    .then(this.sync_qiniu.bind(this))
    .then(this.update_version.bind(this))
    .then(function() {
      return new Promise(this.step(6, null, this.pkg.version));
    }.bind(this))
    .then(this.generate_tar_gz.bind(this));
}

/**
 * @method step
 * @desc 更新发布进度，写入数据库（用户可获取到当前项目的发布进度）；发布过程中每完成一步都会更新进度，详见 service/Deployer#run()
 * @param {number} progress 项目发布进度，详见 model/deployment
 * @param {number} status 发布状态，发布中为 1，空闲为 0
 * @param {string} version 发布的当前项目版本号
 * @returns {Function}
 */
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
      'env.alias': self.args.env
    }, data, function(err) {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  }
}

/**
 * @method prepare
 * @desc 准备发布所需的工作区目录
 * @returns {Promise}
 */
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

/**
 * @method fetch
 * @desc 从 git server 下载项目源码压缩包
 * @returns {Promise}
 */
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

/**
 * @method build
 * @desc 解压 FE 项目源码；编译项目（包管理工具获取依赖，编译 less / stylus / sass ... 为 css，压缩图片，合并文件及其他预处理）；删除源码压缩包
 * @returns {Promise}
 */
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

/**
 * @method read_pkg
 * @desc 读取 FE 项目中的 package.json 配置文件，获取项目 version 和 项目 built 目录
 * @returns {Promise}
 */
Deployer.prototype.read_pkg = function() {
  this._pkg_json_file = path.resolve(this.out_dir, './package.json');

  require.cache[this._pkg_json_file] = null;
  this.pkg = require(this._pkg_json_file);
  // 静态资源服务器的目录(含资源版本)
  this.dest_dir = path.resolve(config[this.args.env].static_server, this.args.username, this.args.name, this.pkg.version);

  return Promise.resolve();
}

/**
 * @method sync_server
 * @desc 同步静态文件到静态服务器，环境不同，静态服务器或存放路径不同
 * @returns {Promise}
 */
Deployer.prototype.sync_server = function() {
  // 项目 build 之后的文件位置
  var src = path.resolve(this.out_dir, this.pkg.dest, './*');

  var err, err_msg;
  var mk_dest_dir = shell.exec('mkdir -p ' + this.dest_dir);
  if (mk_dest_dir.code !== 0) {
    err_msg = '创建静态服务器目录' + this.dest_dir + '失败';
    err = new Error(err_msg);

    throw err;
  }

  var sync_src = shell.exec([
    'cp -rf',
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

/**
 * @method sync_qiniu
 * @desc 同步静态文件到七牛服务器，测试环境无须同步七牛
 * @returns {Promise}
 */
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

/**
 * @method update_version
 * @desc 更新项目版本号到项目版本管理服务器(vermgr), Web 服务器可选择使用静态项目版本
 * @returns {Promise}
 */
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

/**
 * @method generate_tar_gz
 * @desc 使用系统 `tar -czvf` 命令生成静态文件压缩包 x.x.x.tar.gz,
 * 移动端端项目发布可在 Repo Site 下载静态包
 * @returns {Promise}
 */
Deployer.prototype.generate_tar_gz = function() {
  // 静态资源服务器的目录(含资源版本)
  var tar_gz_file = this.dest_dir + this.args.suffix;

  shell.cd(path.dirname(this.dest_dir));

  var err_msg, err;
  var tar_gz_tip_prefix = '生成静态资源压缩包' + tar_gz_file;
  var tar_gz = shell.exec('tar -czvf ' + this.pkg.version + this.args.suffix + ' ' + this.pkg.version);
  shell.cd(config.root);
  if (tar_gz.code !== 0) {
    err_msg = tar_gz_tip_prefix + '失败';
    err = new Error(err_msg);

    throw err;
  }

  return new Promise(this.step(7, 0));
}

/**
 * @module service/Deployer
 * @type {Deployer}
 */
module.exports = Deployer;
