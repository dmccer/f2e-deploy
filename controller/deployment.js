/**
 * 发布
 * @author Kane yunhua.xiao@guluauto.com
 * @type {*|Model|exports|module.exports}
 */
var deployment = require('../model/deployment');

module.exports = function(req, res) {
  var deployment_id = req.params.deployment_id;

  new Promise(function(resolve, reject) {
    deployment.findById(deployment_id, function(err, doc) {
      if (err) {
        reject(err);

        return;
      }

      resolve(doc);
    });
  })
    .then(function() {

    });
}