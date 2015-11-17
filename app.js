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

var rooms = []

io.on('connection', function(socket){
  console.log('a user connected');
  console.log("SOCKET ID: "+socket.id)

  // receiving helpee id when helpee connects
  socket.on('helpeeId', function(msg){
    console.log("Received Helpee ID")
    console.log(msg)
  })

  socket.on('helperId', function(msg){
    console.log("Received Helper ID: "+msg);
    console.log("CREATING ROOM FOR HELPER")
    //create a room with the id of the helper for helpee to join
    rooms.push(msg)
    socket.join(msg)
    console.log(rooms)
  })

  socket.on("helperConnected", function(msg){
    console.log("HELPER CONNECTED");
    
    //create room object and add to rooms array
    var roomDetails = {
       "roomId":msg.roomId,
       "available":true,
       "socketId":socket.id
    }
    rooms.push(roomDetails);
    console.log("CREATED ROOM");

    // helper joins room with same id
    socket.join(msg.roomId);
    console.log("ROOMS COUNT: "+rooms.length)
  })

  socket.on('calling', function(msg){
    console.log("Received from helpee:" + msg)
    socket.broadcast.emit('calling',msg)
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

  socket.on('helperOnline', function(msg){
    console.log('Helper is online');
    if(msg == 'yes'){
      socket.broadcast.emit('helperOnline','yes')
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
    console.log(socket.id)
    var id = socket.id

    // delete room from array when helper leaves
    try{
      for(var i in rooms){
        // check socket id of helper and delete if matches rooms socket id
        if(rooms[i].socketId == id){
          rooms.splice(i,1)
        }
      }
    } catch(err){
      console.log(err)
    }

    console.log("ROOMS COUNT: "+rooms.length)
    
  });
})

// socket namespace to track active rooms
var roomio = io.of('/rooms');
roomio.on('connection', function(socket){
  console.log("a user room connected")
});


module.exports = app;
