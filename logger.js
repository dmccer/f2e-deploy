var log4js = require('log4js');


module.exports = function(category) {
  category = category || 'express';

  log4js.configure({
    appenders: [
      { type: 'console' },
      {
        type: 'file',
        filename: 'logs/express.log',
        category: category
      }
    ]
  });

  return log4js.getLogger(category);
};
