$(document).ready(function(){

	socket= io();
	var answer = false;
	$(".calling").css({'display':'none'});
	var peer = new Peer('helper',{
		key: 's2b0v17d1s8aor',
		debug: 3,
		config: {'iceServers':[
			{url: 'stun:stun.1.google.com:19302'},
			{url: 'stun:stun1.1.google.com:19302'}
		]}
	});

	var canvas = document.getElementById('helperCanvas');
	var context = canvas.getContext('2d');

	peer.on('open', function(id){
		console.log('My id is: ' + id)
		$("#myId").text(id)
	})

	socket.on('help', function(msg){
		console.log(msg);
		if(msg == 'helpme'){
			$(".calling").css({'display':'block'});
		}
	})

	socket.on('helpeeOnline', function(msg){
		console.log('helpee is here');
		if(msg == 'yes'){
			$(".helpeeOnline").css({'display':'block'});
		}
	})

	socket.on('resolution', function(msg){
		context.canvas.height = msg.height;
		context.canvas.width = msg.width;
		console.log("RECEIVED RESOLUTION")
	})

	$("#decline").on('click', function(event){
		event.preventDefault();
		socket.emit('endFromHelper', 'yes')
	})

	peer.on('call', function(incomingCall){
		window.currentHelperCall = incomingCall;
		$("#answer").on('click', function(){
			incomingCall.answer(window.helperStream)
			socket.emit('answered','yes')
		})
		
		incomingCall.on('stream', function(remoteStream){
			window.helperRemoteStream = remoteStream;
			var video = $("#remoteVideo");
			video.attr({'src':URL.createObjectURL(remoteStream)});
		})
	})

	navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

	navigator.getUserMedia({audio:true, video:false}, function(stream){
			console.log(stream)
			window.helperStream = stream;
		}, function(error){
			console.log(error);
		})

})