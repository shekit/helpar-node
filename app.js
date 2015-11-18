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

  ////// CONNECTION SOCKETS ///////
  // when helper connects
  socket.on("helperConnected", function(msg){
    console.log("HELPER CONNECTED");
    
    //create room object and add to rooms array
    var roomDetails = {
       "roomId":msg.roomId,
       "available":true,
       "socketId":socket.id,
       "helpeeSocketId":'',
       "width":0,
       "height":0
    }

    // helper creates and joins room with same id
    socket.join(msg.roomId);

    // if a helpee is waiting
    if(helpeeWaitlist.length>0){
      console.log("FOUND A WAITING HELPEE");
      var waitingHelpee = helpeeWaitlist.shift()
      roomDetails.width = waitingHelpee.width;
      roomDetails.height = waitingHelpee.height;
      io.to(waitingHelpee.id).emit('helperStatus',{"available":"yes","id":msg.roomId})
    }

    rooms.push(roomDetails);
    console.log("CREATED ROOM");

    console.log("NOTIFY ROOMS");
    roomio.emit('rooms',rooms);

    console.log("ROOMS COUNT: "+rooms.length)
    
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
          rooms[i].width = msg.width;
          rooms[i].height = msg.height;
          break;
        }
      }
    }

    // inform helpee about availability of helpers
    if(helperToConnectTo){
      console.log("HELPER IS AVAILABLE")
      io.to(helpeeSocketId).emit('helperStatus',{"available":"yes","id":helperToConnectTo})

    } else {
      console.log("NO HELPER, ADDING TO WAITLIST")
      // add helpee details to wait list
      helpeeWaitlist.push({"id":helpeeSocketId,"width":msg.width,"height":msg.height})
      io.to(helpeeSocketId).emit('helperStatus',{"available":"no","id":"no helper for you yet"})
      roomio.emit("helpeeWaiting","yes");
    }

    console.log("WAILIST COUNT: "+helpeeWaitlist.length)
  })

  // helpee joins the helpers room
  socket.on('joinRoom', function(msg){
    console.log("HELPEE JOINED ROOM")
    var roomIndex = findRoom(msg, "roomId")
    socket.join(msg)
    rooms[roomIndex].available = false;
    // add to room so can mark room as available when helpee leaves
    rooms[roomIndex].helpeeSocketId = socket.id
    console.log("ROOM IS NOW FULL")
    // communicate resolution to helper
    socket.broadcast.to(msg).emit("helpeeStatus",{"status":"joined","width":rooms[roomIndex].width,"height":rooms[roomIndex].height})
    roomio.emit('rooms',rooms)
  })

  /////// CALLING SOCKETS ////////
  socket.on('calling', function(msg){
    console.log("HELPEE IS CALLING")
    console.log("ROOM TO CONNECT TO: "+msg.roomId)
    socket.broadcast.to(msg.roomId).emit('calling','yes')
    console.log("NOTIFIED HELPER IN ROOM OF CALL")
  });


  socket.on('answered', function(msg){
    console.log("HELPER ANSWERED CALL")
    socket.broadcast.to(msg.roomId).emit('answered', 'yes')
  })

  socket.on('endFromHelper', function(msg){
    console.log('HELPER IS ENDING THE CALL');
    socket.broadcast.to(msg.roomId).emit('endFromHelper','yes')
  })


  /////// DRAWING SOCKETS /////////
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


  ////// DISCONNECTION  //////
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
      rooms[roomWhereHelpeeLeft].width = 0;
      rooms[roomWhereHelpeeLeft].height = 0;
      roomio.emit('rooms', rooms);
      socket.broadcast.to(rooms[roomWhereHelpeeLeft].roomId).emit("helpeeStatus",{"status":"left"})
    }

    //delete helpee from waiting list if helpee leaves before a helper joins

    try{
      for(var j in helpeeWaitlist){
        if(helpeeWaitlist[j].id == id){
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
