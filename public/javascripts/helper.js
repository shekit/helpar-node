$(document).ready(function(){
	var peer = new Peer('helper',{
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
		incomingCall.on('stream', function(remoteStream){
			window.remoteStream = remoteStream;
			var video = $("#remoteVideo");
			video.attr({'src':URL.createObjectURL(remoteStream)});
		})
	})

	navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

	navigator.getUserMedia({audio:true, video:false}, function(stream){
			console.log("capturing your audio")
			window.localStream = stream;
		}, function(error){
			console.log(error);
		})

})