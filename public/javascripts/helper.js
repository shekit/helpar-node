$(document).ready(function(){
	canDraw = false;
	socket= io();
	var answer = false;
	$(".getCall").css({'display':'none'});
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
			$(".getCall").css({'display':'block'});
		}
	})

	// when helpee comes online
	socket.on('helpeeOnline', function(msg){
		console.log('helpee is here');
		if(msg == 'yes'){
			$(".helpeeOnline").text('Helpee is online');
		}
	})

	socket.on('resolution', function(msg){

		//$("#helperCanvas").width(msg.width).height(msg.height)
		context.canvas.height = msg.height;
		context.canvas.width = msg.width;
		console.log("RECEIVED RESOLUTION: ",msg.width, msg.height);
		var video = $("video")
		video.innerHeight(msg.height);
		video.innerWidth(msg.width);
	})

	$("#decline").on('click', function(event){
		event.preventDefault();
		socket.emit('endFromHelper', 'yes');
		$(".helpeeOnline").text('Helpee is online');
	})

	$("#clearCanvas").on('click', function(event){
		event.preventDefault();
		context.clearRect(0,0,canvas.width, canvas.height);
		socket.emit('clearCanvas', 'yes');
	})

	peer.on('call', function(incomingCall){
		window.currentHelperCall = incomingCall;
		$("#answer").on('click', function(){
			incomingCall.answer(window.helperStream);
			socket.emit('answered','yes');
			canDraw = true;
		})
		
		incomingCall.on('stream', function(remoteStream){
			window.helperRemoteStream = remoteStream;
			var video = $("#remoteVideo");
			video.attr({'src':URL.createObjectURL(remoteStream)});

			console.log("VIDEO RES: ", video.innerWidth(), video.innerHeight())
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