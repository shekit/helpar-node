var express = require('express');
var socket_io = require("socket.io")
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');



var app = express();

var io = socket_io();
app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('calling', function(msg){
    console.log("Received from helpee:" + msg)
    socket.broadcast.emit('help',msg)
  });

  socket.on('resolution', function(msg){
    console.log("Resolution: ", msg);
    socket.broadcast.emit('resolution', msg)
  })

  socket.on('answered', function(msg){
    console.log("Helper answered the call")
    if(msg == 'yes'){
      socket.broadcast.emit('answered', 'yes')
    }
  })

  socket.on('endFromHelper', function(msg){
    console.log('Helper said to end the call');
    if(msg == 'yes'){
      socket.broadcast.emit('endFromHelper', 'yes')
    }
  })

  socket.on('helpeeOnline', function(msg){
    console.log('Helpee is online');
    if(msg == 'yes'){
      socket.broadcast.emit('helpeeOnline','yes')
    }
  })

  socket.on('startDrawing', function(msg){
    console.log('new path');
    socket.broadcast.emit('startDrawing', 'yes');
  })

  socket.on('drawPoint', function(msg){
    console.log(msg)
    socket.broadcast.emit('drawPoint', msg)
  })

  socket.on('clearCanvas', function(msg){
    console.log("clear Canvas");
    socket.broadcast.emit('clearCanvas', 'yes');
  })

  socket.on('disconnect', function(){
    console.log('a user disconnected')
  });


})


module.exports = app;
