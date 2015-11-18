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

var helpeeWaitlist = [];

io.on('connection', function(socket){
  console.log('a user connected');
  console.log("SOCKET ID: "+socket.id)


  // when helper connects
  socket.on("helperConnected", function(msg){
    console.log("HELPER CONNECTED");
    
    //create room object and add to rooms array
    var roomDetails = {
       "roomId":msg.roomId,
       "available":true,
       "socketId":socket.id,
       "helpeeSocketId":'',
       "members":1
    }

    rooms.push(roomDetails);
    console.log("CREATED ROOM");

    // helper creates and joins room with same id
    socket.join(msg.roomId);
    console.log("ROOMS COUNT: "+rooms.length)

    console.log("NOTIFY ROOMS")
    roomio.emit('rooms',rooms)
  })

  // when helpee connects
  socket.on('helpeeConnected', function(msg){
    console.log("HELPEE CONNECTED")
    var helpeeSocketId = socket.id;
    console.log(helpeeSocketId)
    var helperToConnectTo = null
    if(msg.online=='yes'){
      for(var i in rooms){
        if(rooms[i].available){
          helperToConnectTo = rooms[i].roomId
          rooms[i].available = false;
          break;
        }
      }
    }

    // inform helpee about availability of helpers
    if(helperToConnectTo){
      console.log("HELPER IS AVAILABLE")
      io.to(helpeeSocketId).emit('helperStatus',{"available":"yes","id":helperToConnectTo})

    } else {
      console.log("no helper")
      // add helpee to wait list
      helpeeWaitlist.push(helpeeSocketId)
      io.to(helpeeSocketId).emit('helperStatus',{"available":"no","id":"no helper for you yet"})
    }

    console.log("WAILIST COUNT: "+helpeeWaitlist.length)
  })

  // helpee joins the helpers room
  socket.on('joinRoom', function(msg){
    console.log("HELPEE JOINED ROOM")
    var roomIndex = findRoom(msg, "roomId")
    socket.join(msg)
    rooms[roomIndex].available = false;
    rooms[roomIndex].helpeeSocketId = socket.id
    console.log("ROOM IS NOW FULL")
    roomio.emit('rooms',rooms)
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
    var roomId = findRoom(socket.id, "socketId")
    

    // delete room from array when helper leaves
    

    if(roomId){
      if(rooms[roomId].helpeeSocketId){
        io.to(rooms[roomId].helpeeSocketId).emit("helperLeft","yes");
      }
      rooms.splice(roomId,1)
      roomio.emit('rooms',rooms)
    } else {
      roomio.emit('noHelpers','yes')
    }

    // if helpee leaves call with helper, mark room as available
    var roomWhereHelpeeLeft = findRoom(socket.id, "helpeeSocketId");

    if(roomWhereHelpeeLeft){
      console.log("HELPEE LEFT CHAT FIRST")
      rooms[roomWhereHelpeeLeft].available = true;
      rooms[roomWhereHelpeeLeft].helpeeSocketId = '';
      roomio.emit('rooms', rooms)
    }

    //delete helpee from waitlist if he was there
    try{
      for(var j in helpeeWaitlist){
        if(helpeeWaitlist[j] == id){
          helpeeWaitlist.splice(j,1)
          break;
        }
      }
    } catch(err){
      console.log("ERROR deleting Helpee")
      console.log(err)
    }

    console.log("ROOMS COUNT: "+rooms.length)
    console.log("WAILIST COUNT: "+helpeeWaitlist.length)
    
  });
})

// find index of room
function findRoom(id,param){
  try{
    for(var i in rooms){
      // check socket id or roomid of helper and return index
      if(rooms[i][param] == id){
        return i
      }
    }
  } catch(err){
    console.log("ERROR deleting Helper")
    console.log(err)
  }
  return null
}

// socket namespace to track active rooms
var roomio = io.of('/rooms');
roomio.on('connection', function(socket){
  console.log("a user room connected")
});


module.exports = app;
