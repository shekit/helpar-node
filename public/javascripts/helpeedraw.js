var myPath;

socket.on('startDrawing', function(msg){
	if(msg == 'yes'){
		myPath = new Path();
		myPath.strokeColor = 'red';
		console.log('start path')
	}
})

socket.on('drawPoint',function(msg){
	var point = new Point(msg.x, msg.y)
	//myPath.add(msg)
	console.log(msg)
	myPath.add(point);
	view.draw();
})