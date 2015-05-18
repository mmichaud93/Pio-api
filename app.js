var express = require('express');

var app = express();

var port = Number(process.env.PORT || 53535);

app.listen(port);
console.log("Listening on port: "+port);


app.get('/api', function(req, res) {
  res.send(200);
});