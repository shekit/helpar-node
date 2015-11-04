var myPath;



function onMouseDown(event){
	socket.emit('startDrawing','yes');
	if(myPath){
		myPath.remove();
	}
	
	myPath = new Path();
	myPath.strokeColor = 'red';
	myPath.strokeWidth = '5';
}

function onMouseDrag(event){
	myPath.add(event.point)
	var x = event.point.x;
	var y = event.point.y;
	
	emitPoint(x,y)
}

function onMouseUp(event){
	console.log('ended')
}

function emitPoint(x,y){
	var data = {
		x:x,
		y:y
	}
	socket.emit('drawPoint', data)
	console.log(data)
}