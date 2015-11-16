$(document).ready(function(){

	socket = io();

	//tell helper when you are online
	socket.emit('helpeeOnline', 'yes')

	// when helper comes online after helpee has joined
	socket.on('helperOnline',function(msg){
		socket.emit('helpeeOnline','yes')
		console.log("HELP IS HERE")
	})

	// resolution object to transmit to helper so their video and canvas size matches up
	var resolution = {
		width: 0,
		height: 0
	}

	var canvas = document.getElementById('helpeeCanvas');
	var context = canvas.getContext('2d');

	// peer js config
	var peer = new Peer('helpee',{
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
		console.log('My id is: ' + id)
	})


	// peer.on('call', function(incomingCall){
	// 	window.currentCall = incomingCall;
	// 	incomingCall.answer(window.localStream);
	// 	incomingCall.on('stream', function(remoteStream){
	// 		window.remoteStream = remoteStream;
	// 		var audio = $("#remoteAudio");
	// 		audio.attr({'src':URL.createObjectURL(remoteStream)});
	// 		// show end call button
	// 		$("#makeCall").fadeOut();
	// 		$("#endCall").fadeIn()
	// 		console.log("RECEIVINGGGG")
	// 	})
	// })

	
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
		window.localStream = stream;
		video.onloadedmetadata=function(event){
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
		}
	})
	.catch(function(err){
		console.log(err.name + ": " + err.message)
	})

	//call helper
	$("#makeCall").on('click', function(event){
		event.preventDefault();
		socket.emit('calling', 'helpme');
		//communicate resolution
		socket.emit('resolution', resolution);
		$(".calling").css({'display':'block'})

		var outgoingCall = peer.call('helper', window.localStream);
		window.currentCall = outgoingCall;
		outgoingCall.on('stream', function(remoteStream){
			window.remoteStream = remoteStream
			var audio = $("#remoteAudio");
			audio.attr({'src':URL.createObjectURL(remoteStream)});
			// show end call button
			$("#makeCall").fadeOut();
			$("#endCall").fadeIn()
			console.log("RECEIVINGGGG");
		})

	})

	// if helper answers show connecting text
	socket.on('answered', function(msg){
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
		if(msg=='yes'){
			endCall();
		}
	})

	// end call initiated by HELPEE
	$("#endCall").on('click', function(event){
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