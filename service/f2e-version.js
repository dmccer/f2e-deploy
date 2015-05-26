var log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' },
    {
      type: 'file',
      filename: 'log/express.log',
      category: 'publish'
    }
  ]
});

var logger = log4js.getLogger('publish');

module.exports = function (name, version, url) {
  logger.info('写入版本中...');
  logger.info(name + ' - ' + version + ' - ' + url);
};
