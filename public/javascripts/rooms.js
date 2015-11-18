$(document).ready(function(){

	//connect to rooms namespace
	var roomSocket = io('http://localhost:3000/rooms')

	roomSocket.on('rooms', function(msg){
		for (var i in msg){
			console.log("ROOM "+i+": "+msg[i].roomId)
			console.log("AVAILABILITY: "+msg[i].available)
		}
	})

	roomSocket.on('noHelpers', function(msg){
		console.log("All helpers are gone!!!")
	})

})