var myPath;

var canvas = document.getElementById('helpeeCanvas');
var context = canvas.getContext('2d');

socket.on('startDrawing', function(msg){
	if(msg == 'yes'){
		if(myPath){
			myPath.remove();
		}
		context.clearRect(0,0,canvas.width, canvas.height);
		myPath = new Path();
		myPath.strokeColor = 'red';
		myPath.strokeWidth = '5';
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