var express = require('express');
var bodyParser = require('body-parser')
var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.post('/deploy', function (req, res) {
  console.log('req: ', req.body);

  res.send('Hello World!');
});

var server = app.listen(9999, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('git web hook server: ', host, port);
});
