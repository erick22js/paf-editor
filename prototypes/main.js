
var pam = {};
/*
window.onload = function(){
	File.pickBuffer(function(files){
		pam = pamDecode(files[0]);
	});
}
*/
infile.onchange = function(v){
	var names = [];
	for(var i=0; i<v.target.files.length; i++){
		var file = v.target.files[i];
		var reader = new FileReader();
		names.push(file.name);
		
		reader.onload = function(e) {
			var data = e.target.result;
			var stream = [];
			data = new Uint8Array(data);
			var file = File.openBuffer(data);
			reanim = reanimDecode(file);
			console.log(reanim);
			/*
			for(var i=0; i<data.length; i++){
				stream.push((Number(data[i]) || 0)&0xFF);
			}
			var name = files[files_i];
			files[files_i] = create(stream, self.READ_WRITE, 0);
			files[files_i].name = name;
			files_i++;
			*/
		};
		reader.onerror = function(e) {
			console.log('Error: ' + e.type);
		};
		reader.readAsArrayBuffer(file);
	}
}



/**
	RENDERING
*/

const ctx = tela.getContext("2d");
/*
var bo = boCreate(300, 300);

boAddBox(bo, 50, 35, 0);
boAddBox(bo, 40, 30, 1);
boAddBox(bo, 45, 50, 2);
boAddBox(bo, 80, 40, 3);
boAddBox(bo, 60, 45, 4);
boAddBox(bo, 50, 85, 5);
*/

var bb = bbCreate(300, 300);

bbAddBox(bb, 75, 50);
/*
bbAddBox(bb, 45, 37);
bbAddBox(bb, 60, 45);
bbAddBox(bb, 60, 45);
bbAddBox(bb, 100, 80);

bbAddBox(bb, 20, 40);
bbAddBox(bb, 250, 90);
*/

function show(){
bbFitBoxes(bb);
ctx.clearRect(0, 0, 300, 300);
for(var c in bb.corners){
	var corner = bb.corners[c];
	ctx.strokeStyle = "red";
	ctx.fillStyle = "red";
	ctx.lineWidth = 2;
	ctx.strokeRect(corner.left, corner.top, corner.width, corner.height);
	ctx.globalAlpha = .03;
	ctx.fillRect(corner.left, corner.top, corner.width, corner.height);
	ctx.globalAlpha = 1;
}
for(var i in bb.boxes){
	var rect = bb.boxes[i];
	ctx.strokeStyle = "blue";
	ctx.lineWidth = 1;
	ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
}
}

show();

window.ontouchend = function(){
	//bbAddBox(bb, 100, 80);
	bbAddBox(bb, 10+Math.random()*70, 10+Math.random()*70);
	show();
}
