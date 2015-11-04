$(document).ready(function(){

	socket = io();
	socket.emit('helpeeOnline', 'yes')


	var resolution = {
		width: 0,
		height: 0
	}

	var canvas = document.getElementById('helpeeCanvas');
	var context = canvas.getContext('2d');

	var peer = new Peer('helpee', {
		key: 's2b0v17d1s8aor',
		debug: 3,
		config: {'iceServers':[
			{url: 'stun:stun.1.google.com:19302'},
			{url: 'stun:stun1.1.google.com:19302'}
		]}
	});

	peer.on('open', function(id){
		console.log('My id is: ' + id)
		$("#myId").text(id)
	})


	peer.on('call', function(incomingCall){
		window.currentCall = incomingCall;
		incomingCall.answer(window.localStream);
		incomingCall.on('stream', function(remoteStream){
			window.remoteStream = remoteStream;
			var audio = $("#remoteAudio");
			audio.attr({'src':URL.createObjectURL(remoteStream)});
		})
	})

	navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

	navigator.getUserMedia({audio:true, video:true}, function(stream){
		var video = $("#localVideo");
		video.attr({'src': URL.createObjectURL(stream)})
		window.localStream = stream;
		resolution.width = video.innerWidth();
		resolution.height = video.innerHeight();
	}, function(error){
		console.log(error)
	})

	$("#makeCall").on('click', function(){
		socket.emit('calling', 'helpme');
		socket.emit('resolution', resolution);

		$(".calling").css({'display':'block'})

		var outgoingCall = peer.call('helper', window.localStream);
		window.currentCall = outgoingCall;
		outgoingCall.on('stream', function(remoteStream){
			window.remoteStream = remoteStream
		})

	})

	socket.on('answered', function(msg){
		if(msg == 'yes'){
			$(".calling").text('Connecting...')
			setTimeout(function(){
				$(".calling").css({'display':'none'})
				$(".calling").text('Calling...')
			}, 500)
		}
	})

	socket.on('endFromHelper', function(msg){
		if(msg=='yes'){
			console.log('end call')
			window.currentCall.close();
		}
	})

	socket.on('clearCanvas', function(msg){
		context.clearRect(0,0,canvas.width, canvas.height);
	})

	$("#endCall").on('click', function(){
		window.currentCall.close();
	})



})