/**
 * Web hook for Git server push event
 * @module controller/push
 * @author Kane yunhua.xiao@guluauto.com
 * @todo 封装成类
 * @todo 多线程处理
 */
var repo = require('../model/repo');
var deployment = require('../model/deployment');

/**
 * 创建或更新项目
 * @param repo_data
 * @returns {Promise}
 */
function update_repo(repo_data) {
  delete repo_data.id;

  return repo
    .findOneAndUpdate({
      name: repo_data.name,
      owner: {
        name: repo_data.owner.name
      },
      repo_id: repo_data.id,
    }, repo_data, {
      new: true,
      upsert: true
    })
    .exec();
}

/**
 * 构造部署记录数据
 * @param body
 * @param repo
 * @returns {Mixed}
 */
function build_deploy_data(body, repo) {
  console.info('写入 repository 成功');
  console.dir(repo);
  var pubers = [];

  pubers.push(body.repository.owner);
  pubers.push(body.pusher);

  body.commits.forEach(function(commit) {
    pubers.push(commit.author);
  });

  return {
    branch: body.ref.replace('refs/heads/', ''),
    repo_id: repo._id,
    before: body.before,
    after: body.after,
    pubers: pubers
  };
}

/**
 * 创建或更新部署记录
 * @param deploy_data
 * @returns {Promise}
 */
function update_deployment(deploy_data) {
  console.debug('==== deploy_data:', arguments);

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
  console.dir(deployment);

  res.status(200).json({
    msg: 'Push 处理成功'
  });
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
module.exports = function(req, res) {
  var body = req.body;

  console.log(body);

  update_repo(body.repository)
    .then(build_deploy_data.bind(null, body))
    .then(update_deployment)
    .then(push_ok)
    .catch(push_fail.bind(null, res, body));
}