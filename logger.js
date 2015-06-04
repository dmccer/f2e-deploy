var log4js = require('log4js');

module.exports = function(file, category) {
  category = category || 'deploy';

  log4js.configure({
    appenders: [
      { type: 'console' },
      {
        type: 'file',
        filename: file || 'log/deploy.log',
        category: category
      }
    ],
    replaceConsole: false
  });

  return log4js.getLogger(category);
};
