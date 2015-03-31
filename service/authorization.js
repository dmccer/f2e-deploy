var config = require('../config');

module.exports = {
  check: function (secret) {
    return secret === config.default_secret;
  }
}