var express = require('express');
var app = express();

app.post('/deploy', function (req, res) {
  console.log('req: ', req.body);

  res.send('Hello World!');
});

var server = app.listen(9999, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('git web hook server: ', host, port);
});
