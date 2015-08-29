var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var config = require('./config');
var log4js = require('log4js');
var logger = require('./logger')('log/deploy.log', 'deploy');
var sign = require('./controller/sign');
var api = require('./api');
var web = require('./web');

var app = express();

require('./db');

app.use(favicon(__dirname + '/favicon.png'));
app.use(log4js.connectLogger(logger, { level: 'auto' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('cookie-parser')(config.session_secret));
app.use(session({
  secret: config.session_secret,
  store: new RedisStore({
    port: config.redis.port,
    host: config.redis.host,
  }),
  resave: true,
  saveUninitialized: true,
}));

app.use(sign.auth_user);
app.use('/', web);
app.use('/f2e', api);

module.exports = app;
