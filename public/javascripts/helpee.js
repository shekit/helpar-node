$(document).ready(function(){

	socket = io();

	//tell helper when you are online
	socket.emit('helpeeOnline', 'yes')

	// resolution object to transmit to helper so their video and canvas size matches up
	var resolution = {
		width: 0,
		height: 0
	}

	var canvas = document.getElementById('helpeeCanvas');
	var context = canvas.getContext('2d');

	// peer js config
	var peer = new Peer('helpee', {
		key: 's2b0v17d1s8aor',
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
	
	// grab camera feed
	navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

	navigator.getUserMedia({audio:true, video:true}, function(stream){
		var video = $("#localVideo");
		video.attr({'src': URL.createObjectURL(stream)})
		window.localStream = stream;
		//set resolution to communicate via socket to receiver so that their video and canvas matches helpees size
		console.log("Resolution: ");
		console.log(resolution)
		
	}, function(error){
		console.log(error)
	})

	//once video is loaded
	$("#localVideo").on('loadedmetadata', function(){
		console.log("LOADED DATA")
		var self = $(this)
		// show call button
		$("#makeCall").fadeIn();
		resolution.width = self.innerWidth();
		resolution.height = self.innerHeight();
		console.log(resolution);

		var canvas = $("canvas")
		canvas.innerHeight(self.innerHeight());
		canvas.innerWidth(self.innerWidth());
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

	// if helper ends the call
	socket.on('endFromHelper', function(msg){
		if(msg=='yes'){
			console.log('end call')
			window.currentCall.close();
		}
	})

	// clear helpess canvas when helper clears his
	socket.on('clearCanvas', function(msg){
		context.clearRect(0,0,canvas.width, canvas.height);
	})

	// end call to helper
	$("#endCall").on('click', function(event){
		event.preventDefault();
		window.currentCall.close();
		$("#endCall").fadeOut('100')
		$("#makeCall").fadeIn();
	})

})