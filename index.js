var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');

var http = require('http');
var app = express();

const port = 3000;

app.use(morgan('dev'));
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '50mb'
}));



var CONSTANTS = new (require('./utils/CONSTANTS'))();
var messages = new (require('./utils/messages'))();
var serverRoutes = new (require('./routes/serverRoutes'))(app, CONSTANTS, messages);
var server = http.createServer(app);
server.listen(port, function () {
    console.log('Server started in production mode @ ' + port);
})
module.exports = app;