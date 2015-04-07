var root_path = __dirname;
var path = require('path');

module.exports = {
  default_secret: 'yunhua@926',
  alpha_work_path: path.resolve(root_path, './deploy/alpha'),
  prelease_work_path: path.resolve(root_path, './deploy/prelease'),
  prd_work_path: path.resolve(root_path, './deploy/prd'),

  qiniu: path.resolve(root_path, './conf.json'),

  static_server: {
    alpha: '/usr/share/nginx/html'
  }
}