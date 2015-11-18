var myPath;

var canvas = document.getElementById('helperCanvas');
var context = canvas.getContext('2d');

function onMouseDown(event){
	if(canDraw){
		socket.emit('startDrawing',{"roomId":helperId});
		if(myPath){
			myPath.remove();
		}
		context.clearRect(0,0,canvas.width, canvas.height);
		myPath = new Path();
		myPath.strokeColor = 'red';
		myPath.strokeWidth = '5';
	} else {
		return;
	}
}

function onMouseDrag(event){
	if(canDraw){
		myPath.add(event.point)
		var x = event.point.x;
		var y = event.point.y;
		
		emitPoint(x,y)
	}
}

function onMouseUp(event){
	console.log('DREW SOMETHING')
}

function emitPoint(x,y){
	var data = {
		"roomId":helperId,
		x:x,
		y:y
	}
	socket.emit('drawPoint', data)
	console.log(data)
}