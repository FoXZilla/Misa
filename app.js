console.log(`\
  _________________________________________________________
 |_________________________________________________________|
 |_______________________#_________________________________|
 |________________##____###________________________________|
 |______####_____###_______________________________________|
 |______#####___####________________##_____________________|
 |_______#####__####____###_______###_______####___________|
 |_______##_#####_##____##______##_________#__##___________|
 |_______##__###___##___##_____######_____##__##___________|
 |_______##________##___##_________#####__#___##___________|
 |_______##________###___##_________###___#__###___________|
 |_______##_________##___##___######______####_#####_______|
 |_________________________________________________________|
 |_________________________________________________________|
 |_________________________________________________________|
`);

var {frontUrl,attachmentPath} =require("./lib/config-reader");

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');

var app = express();
app.use(async function(req, res, next) {
  res.set('Access-Control-Allow-Origin', await frontUrl());
  res.set('Access-Control-Allow-Credentials', 'true');
  next();
});
// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json({type:'*/*'}));
app.use(cookieParser());


app.use('/', index);
app.use(express.static(attachmentPath()));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
      errmsg :err.toString(),
      errcode:0,
  });
});

module.exports = app;
