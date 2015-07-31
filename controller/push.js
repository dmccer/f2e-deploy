/**
 * Web hook for Git server push event
 * @module controller/push
 * @author Kane yunhua.xiao@guluauto.com
 */
module.exports = function(req, res) {
  var repo = req.body;

  console.log(repo);

  // TODO
  // 1. 设计 repo 表
  // 2. 写入 repo 到数据库
}