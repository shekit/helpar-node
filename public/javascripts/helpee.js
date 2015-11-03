$(document).ready(function(){

	var socket = io();

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
	}, function(error){
		console.log(error)
	})

	$("#makeCall").on('click', function(){
		var outgoingCall = peer.call('helper', window.localStream);
		window.currentCall = outgoingCall;
		outgoingCall.on('stream', function(remoteStream){
			window.remoteStream = remoteStream
		})
	})

	$("#endCall").on('click', function(){
		window.currentCall.close();
	})

})