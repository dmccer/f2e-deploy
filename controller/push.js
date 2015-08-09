/**
 * Web hook for Git server push event
 * @module controller/push
 * @author Kane yunhua.xiao@guluauto.com
 */
var repo = require('../model/repo');
var deployment = require('../model/deployment');

/**
 * 创建或更新项目
 * @param repo_data
 * @returns {Promise}
 */
function update_repo(repo_data, resolve, reject) {
  var repo_id = repo_data.id;
  delete repo_data.id;

  repo_data.owner_name = repo_data.owner.username;

  return repo
    .findOneAndUpdate({
      name: repo_data.name,
      repo_id: repo_id
    }, repo_data, {
      new: true,
      upsert: true
    })
    .exec(function(err, doc) {
      if (err) {
        return reject(err);
      }

      resolve(doc);
    });
}

/**
 * 构造部署记录数据
 * @param body
 * @param repo
 * @returns {Promise}
 */
function build_deploy_data(body, repo) {
  console.info('写入 repository 成功');
  console.dir(repo.toObject());
  var pubers = [];

  pubers.push(body.repository.owner);
  //pubers.push(body.pusher);

  //body.commits.forEach(function(commit) {
  //  pubers.push(commit.author);
  //});

  return Promise.resolve({
    branch: body.ref.replace('refs/heads/', ''),
    repo_id: repo.toObject().id,
    before: body.before,
    after: body.after,
    pubers: pubers
  });
}

/**
 * 创建或更新部署记录
 * @param deploy_data
 * @returns {Promise}
 */
function update_deployment(deploy_data) {
  deploy_data.$setOnInsert = {
    create_time: new Date()
  };

  return deployment
    .findOneAndUpdate({
      branch: deploy_data.branch,
      repo_id: deploy_data.repo_id
    }, deploy_data, {
      new: true,
      upsert: true
    })
    .exec();
}

/**
 * push 事件成功回调
 * @param res
 * @param deployment
 */
function push_ok(res, deployment) {
  console.info('写入 deployment 成功:');
  console.dir(deployment.toObject());

  res.status(200).json({
    msg: 'Push 处理成功'
  });

  return Promise.resolve();
}

/**
 * push 事件失败回调
 * @param res
 * @param body
 * @param err
 */
function push_fail(res, body, err) {
  console.warn('Push 事件处理失败:');
  console.log(err);
  console.warn('参数如下:');
  console.dir(body);

  res.status(500).json({
    msg: 'Push 事件处理失败:' + err.message
  });
}

/**
 * Git push 事件处理器
 * @function
 * @param req
 * @param res
 */
module.exports = function (req, res) {
  var body = req.body;
  var push_fail_bind = push_fail.bind(null, res, body);

  new Promise(update_repo.bind(null, body.repository))
    .then(build_deploy_data.bind(null, body))
    .then(update_deployment)
    .then(push_ok.bind(null, res))
    .catch(push_fail_bind)
}