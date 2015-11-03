$(document).ready(function(){

	console.log("hello")

	var peer = new Peer({
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

	//var conn = peer.connect('nhb1c1eo4grv0a4i');

	//console.log(conn)

	peer.on('call', function(incomingCall){
		window.currentCall = incomingCall;
		incomingCall.answer(window.localStream);
		incomingCall.on('stream', function(remoteStream){
			window.remoteStream = remoteStream;
			var video = $("#remoteVideo");
			video.attr({'src':URL.createObjectURL(remoteStream)})
		})
	})

	navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

	$("#grabVideo").on('click', function(){
		navigator.getUserMedia({audio:true, video:true}, function(stream){
			var video = $("#localVideo");
			video.attr({'src':URL.createObjectURL(stream)})
			window.localStream = stream;
		}, function(error){
			console.log(error);
		})
	})

	$("#endVideo").on('click', function(){
		window.localStream.stop();
	})
	

	$("#makeCall").on('click', function(){
		var outgoingCall = peer.call($("#remotePeerId").val(), window.localStream);
		window.currentCall = outgoingCall;
		outgoingCall.on('stream', function(remoteStream){
			window.remoteStream = remoteStream;
			var video = $("#remoteVideo");
			video.attr({'src':URL.createObjectURL(stream)})
		})
	})

	$("#endCall").on('click', function(){
		window.currentCall.close();
	})
})