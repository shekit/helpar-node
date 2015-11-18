$(document).ready(function(){

	socket = io();

	// can only draw if helpee is connected
	canDraw = false;

	var canvas = document.getElementById('helperCanvas');
	var context = canvas.getContext('2d');

	var answer = false;

	var video = $("video")
	
	//if helpee connects before helper, let them know helper is online
	//socket.emit('helperOnline','yes')

	$(".getCall").css({'display':'none'});

	var peer = new Peer({
		key: '3dqzrq8u2aitfbt9',
		// host: '104.131.82.13',
		// port: 9000,
		// path: '/',
		debug: 3,
		config: {'iceServers':[
			{url: 'stun:stun.1.google.com:19302'},
			{url: 'stun:stun1.1.google.com:19302'}
		]}
	});

	//global to work in paper js script
	helperId = null;
	
	peer.on('open', function(id){
		helperId = id;
		console.log("Helper ID: "+helperId)
		console.log("SEND HELPER DETAILS TO SERVER")
		socket.emit("helperConnected", {"online":"yes","id":id,"roomId":id})
	})

	socket.on('calling', function(msg){
		console.log("INCOMING CALL FROM HELPEE")
		if(msg == 'yes'){
			$(".getCall").css({'display':'block'});
		}
	})

	// when helpee comes online
	socket.on('helpeeStatus', function(msg){
		if(msg.status=='joined'){
			console.log("HELPEE IS HERE, GOT RESOLUTION")
			console.log("WIDTH: "+msg.width)
			console.log("HEIGHT: "+msg.height)
		} else if(msg.status=='left'){
			console.log("HELPEE LEFT CHAT")
		}
	})

	// set video and canvas size based on helpee's resolution
	socket.on('resolution', function(msg){
		context.canvas.height = msg.height;
		context.canvas.width = msg.width;
		console.log("RECEIVED RESOLUTION: ",msg.width, msg.height);

		video.innerHeight(msg.height);
		video.innerWidth(msg.width);
	})

	$("#decline").on('click', function(event){
		event.preventDefault();
		socket.emit('endFromHelper', {"roomId":helperId});
		$(".helpeeOnline").text('Helpee is online');
		$("video").hide()
	})

	$("#clearCanvas").on('click', function(event){
		event.preventDefault();
		context.clearRect(0,0,canvas.width, canvas.height);
		// clear canvas of helpee as well
		socket.emit('clearCanvas', {"roomId":helperId});
	})

	peer.on('call', function(incomingCall){
		window.currentHelperCall = incomingCall;
		$("#answer").on('click', function(){
			incomingCall.answer(window.helperAudioStream);
			socket.emit('answered',{"roomId":helperId});
			canDraw = true;
		})
		
		incomingCall.on('stream', function(remoteHelpeeStream){
			window.remoteHelpeeStream = remoteHelpeeStream;
			video.attr({'src':URL.createObjectURL(remoteHelpeeStream)});

			console.log("VIDEO RES: ", video.innerWidth(), video.innerHeight())
		})
	})

	// get audio feed
	navigator.mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
   		getUserMedia: function(c) {
     		return new Promise(function(y, n) {
       			(navigator.mozGetUserMedia ||
        		navigator.webkitGetUserMedia).call(navigator, c, y, n);
     		});
   		}
	} : null);

	if (!navigator.mediaDevices) {
	  console.log("getUserMedia() not supported.");
	  return;
	}

	//only grab audio as helper doesnt need to see himself
	var constraints = {audio:true, video:false}

	navigator.mediaDevices.getUserMedia(constraints)
	.then(function(stream){
		window.helperAudioStream = stream
	})
	.catch(function(err){
		console.log(err.name + ": "+err.message)
	})

})