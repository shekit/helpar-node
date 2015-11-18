$(document).ready(function(){

	socket = io();
	console.log('HELPEE CONNECTED')
	//tell helper when you are online
	$("#helperOnline").hide();


	// when helper comes online after helpee has joined
	// socket.on('helperOnline',function(msg){
	// 	socket.emit('helpeeOnline','yes')
	// 	console.log("HELP IS HERE")
	// 	//$("#helperOnline").fadeIn(300);
	// 	// show button after little delay
	// 	setTimeout(function(){
	// 		$("#makeCall").show();
	// 	},1000)
	// })

	// resolution object to transmit to helper so their video and canvas size matches up
	var resolution = {
		width: 0,
		height: 0
	}

	var canvas = document.getElementById('helpeeCanvas');
	var context = canvas.getContext('2d');

	var helpeeId = null;

	//global to work in paper js script
	helperId = null;

	// peer js config
	var peer = new Peer({
		key: '3dqzrq8u2aitfbt9',
		// host: '104.131.82.13',
		// port: 9000,
		//path: '/',
		debug: 3,
		config: {'iceServers':[
			{url: 'stun:stun.1.google.com:19302'},
			{url: 'stun:stun1.1.google.com:19302'}
		]}
	});

	// on connecting to peerjs
	peer.on('open', function(id){
		helpeeId = id;
		console.log("GOT HELPEE ID");
		console.log("HELPEE ID: "+helpeeId)
		//socket.emit("helpeeId",id)
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

	socket.on('helperStatus', function(msg){
		if(msg.available == 'yes'){
			console.log("You have a helper, assign it to peer id and show call button")
			helperId = msg.id
			socket.emit('joinRoom',helperId)
		} else {
			console.log("No helper yet. Wait for someone")
		}
	})

	socket.on('helperLeft', function(msg){
		console.log("YOU Have been ABANDONED!")
		//endCall();
	})
	
	// get camera feed
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

	var constraints = {audio:true, video:true}

	navigator.mediaDevices.getUserMedia(constraints)
	.then(function(stream){
		var video = document.querySelector('video');
		video.src = window.URL.createObjectURL(stream);
		window.helpeeStream = stream;
		video.onloadedmetadata=function(event){
			console.log("GOT VIDEO")
			
			video.play();
			// show call button
		 	$("#makeCall").fadeIn();

			//set resolution to communicate via socket to receiver so that their video and canvas matches helpees size
			resolution.width = video.getBoundingClientRect().width 
			resolution.height = video.getBoundingClientRect().height
			console.log(resolution)

			//set canvas to match size of video
			var canvas = $("canvas")
			canvas.innerHeight(resolution.height);
			canvas.innerWidth(resolution.width);

			context.canvas.height = resolution.height;
			context.canvas.width = resolution.width;
			console.log("SET CANVAS TO VIDEO SIZE")

			console.log("SEND HELPEE DETAILS TO SERVER")
			socket.emit('helpeeConnected',{"online":"yes","id":helpeeId,"width":resolution.width,"height":resolution.height})
		}
	})
	.catch(function(err){
		console.log("ERROR IN GETTING VIDEO")
		console.log(err.name + ": " + err.message)
	})

	//call helper
	$("body").on('click',"#makeCall", function(event){
		event.preventDefault();
		//socket.emit('calling', 'yes');
		socket.emit('calling',{"roomId":helperId})
		//communicate resolution
		//socket.emit('resolution', resolution);
		$(".calling").css({'display':'block'})

		//call helper providing helpee stream from getusermedia
		var outgoingCall = peer.call(helperId, window.helpeeStream);
		//set to variable so we can access it to close it later
		window.currentCall = outgoingCall;

		// on receiving audio from helper add it to audio element
		outgoingCall.on('stream', function(remoteHelperStream){
			window.remoteHelperStream = remoteHelperStream
			console.log("HELPER PEER ID: "+outgoingCall.id);
			var audio = $("#remoteAudio");
			audio.attr({'src':URL.createObjectURL(remoteHelperStream)});
			// show end call button
			$("#makeCall").fadeOut();
			$("#endCall").fadeIn()
			console.log("CONNECTED TO HELPER");
		})

		outgoingCall.on('error', function(){
			console.log("ERROR CONNECTING")
		})

	})

	// if helper answers show connecting text
	socket.on('answered', function(msg){
		console.log("HELPER ANSWERED YOUR CALL")
		if(msg == 'yes'){
			$(".calling").text('Connecting...')
			setTimeout(function(){
				$(".calling").css({'display':'none'})
				$(".calling").text('Calling...')
			}, 500)
		}
	})

	// clear helpee canvas when helper clears his
	socket.on('clearCanvas', function(msg){
		context.clearRect(0,0,canvas.width, canvas.height);
	})

	// end call initiated by HELPER
	socket.on('endFromHelper', function(msg){
		console.log("HELPER ENDED THE CALL")
		if(msg=='yes'){
			endCall();
		}
	})

	// end call initiated by HELPEE
	$("#endCall").on('click', function(event){
		console.log("YOU ENDED THE CALL")
		event.preventDefault();
		endCall()
	})

	// end call
	function endCall(){
		console.log("END CALL")
		window.currentCall.close();
		$("#endCall").fadeOut('100')
		$("#makeCall").fadeIn();
		//clear any drawn elements
		context.clearRect(0,0,canvas.width, canvas.height);
	}

})