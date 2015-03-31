var shell = require('shelljs');

module.exports = {
  build: function (data, dest) {
    console.log('repo info:')
    console.log('commits id: ', data.commits.id);
    console.log('work path: ', dest);
  }
}