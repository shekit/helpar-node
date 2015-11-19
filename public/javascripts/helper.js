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
			{url: 'stun:stun1.1.google.com:19302'} // place turn server here
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

	peer.on('disconnected', function(){
		console.log("YOU HAVE BEEN DISCONNECTED")
		console.log("ATTEMPTING TO RECONNECT")
		//peer.reconnect();
	})

	peer.on('error', function(err){
		console.log("ERROR: "+err.type);
		
		switch(err.type){
			case "browser-incompatible":
				alert("WebRTC not supported. Your browser is old. Switch to google chrome");
				break;
			case "network":
				alert("Connectivity problems. Check internet connection")
				break
			case "peer-unavailable":
				alert("The person you are trying to connect to doesnt exist")
				break;
			case "ssl-unavailable":
				alert("SSL not supported on your server")
				break;
			case "server-error":
				alert("Unable to reach server")
				break;
			default:
				alert(err.type)
				break;
		}
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
			console.log("END THE CALL")
			window.currentHelperCall.close();
			// tell possible waiting helpees you are available
			socket.emit("helperAvailableAgain",{"roomId":helperId})
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
		window.currentHelperCall.close();
		$(".helpeeOnline").text('Helpee is online');
		//$("video").hide()
	})

	$("#clearCanvas").on('click', function(event){
		event.preventDefault();
		context.clearRect(0,0,canvas.width, canvas.height);
		// clear canvas of helpee as well
		socket.emit('clearCanvas', {"roomId":helperId});
	})

	peer.on('call', function(incomingCall){
		window.currentHelperCall = incomingCall;

		console.log("HELPEE PEER ID: "+incomingCall.peer)
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

		incomingCall.on('error', function(err){
			console.log("ERROR GETTING HELPEE STREAM")
			console.log(err);
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