
function reanimDecode(file){
	// Identify and do needed zlib decompression
	if(file.readS32()==-559022380){
		var size = file.readS32();
		var data = pako.inflate(file.toBinary(file.tell()));
		file = File.openBuffer(data);
	}
	else{
		file.seekSet(0);
	}
	
	// Start decoding into reanim the given file
	var reanim = {};
	
	file.seekSet(8);
	var count_tracks = file.readS32();
	reanim.tracks = new Array(count_tracks);
	reanim.fps = file.readFloat32();
	file.seekCur(4);
	
	//
	// Uses type for reanim format distinguish
	// 0x14 = Android TV
	// 0x0C = PC
	//
	var type = file.readS32();
	reanim.type = type;
	var is_tv = type==0x14;
	var is_pc = type==0x0C;
	
	for(var t=0; t<count_tracks; t++){
		if(is_pc){
			file.seekCur(8);
		}
		if(is_tv){
			file.seekCur(12);
		}
		reanim.tracks[t] = {
			"transforms": new Array(file.readS32())
		};
		if(is_tv){
			file.seekCur(4);
		}
	}
	
	for(var t=0; t<count_tracks; t++){
		var track = reanim.tracks[t];
		track.name = file.readString(file.readS32());
		
		file.readS32() // ? Maybe this value should be equal to 0x30
		
		for(var m=0; m<track.transforms.length; m++){
			var transform = {};
			var temp = file.readFloat32();
			if(temp!=-(10000)){
				transform.x = temp;
			}
			temp = file.readFloat32();
			if(temp!=-(10000)){
				transform.y = temp;
			}
			temp = file.readFloat32();
			if(temp!=-(10000)){
				transform.kx = temp;
			}
			temp = file.readFloat32();
			if(temp!=-(10000)){
				transform.ky = temp;
			}
			temp = file.readFloat32();
			if(temp!=-(10000)){
				transform.sx = temp;
			}
			temp = file.readFloat32();
			if(temp!=-(10000)){
				transform.sy = temp;
			}
			temp = file.readFloat32();
			if(temp!=-(10000)){
				transform.f = temp;
			}
			temp = file.readFloat32();
			if(temp!=-(10000)){
				transform.a = temp;
			}
			if(is_tv){
				file.seekCur(16);
			}
			if(is_pc){
				file.seekCur(12);
			}
			track.transforms[m] = transform;
		}
		for(var m=0; m<track.transforms.length; m++){
			var transform = track.transforms[m];
			
			var ts = file.readString(file.readS32());
			if(ts != ''){
				transform.i = ts;
			}
			if(is_tv){
				ts = file.readString(file.readS32());
				if(ts != ''){
					transform.ipath = ts;
				}
				ts = file.readString(file.readS32());
				if(ts != ''){
					transform.i2 = ts;
				}
				ts = file.readString(file.readS32());
				if(ts != ''){
					transform.i2path = ts;
				}
			}
			ts = file.readString(file.readS32());
			if(ts != ''){
				transform.font = ts;
			}
			ts = file.readString(file.readS32());
			if(ts != ''){
				transform.text = ts;
			}
		}
	}
	
	return reanim;
}


function reanimToPaf(proj, reanimdata){
	// Splits every track into two main groups: tobjs and tanims
	var tobjs = [];
	var tanims = [];
	for(var i=0; i<reanimdata.tracks.length; i++){
		if(reanimdata.tracks[i].name.startsWith("anim_")){
			tanims.push(reanimdata.tracks[i]);
		}
		else{
			tobjs.push(reanimdata.tracks[i]);
		}
	}
	
	// Properties
	proj.fps = reanimdata.fps;
	
	// Images and sources
	var images = {};
	
	// Replicate data for every object
	for(var o=0; o<tobjs.length; o++){
		var to = tobjs[o].transforms;
		
		for(var f=0; f<to.length; f++){
			var fo = to[f];
			
			// Image found
			if(fo.i){
				images[fo.i] = images[fo.i]||{};
				tobjs[o].i = images[fo.i];
			}
			
			// First frame
			if(f==0){
				if(fo.f != -1){
					fo.f = 0;
				}
				if(typeof fo.x === 'undefined'){
					fo.x = 0;
				}
				if(typeof fo.y === 'undefined'){
					fo.y = 0;
				}
				if(typeof fo.sx === 'undefined'){
					fo.sx = 1;
				}
				if(typeof fo.sy === 'undefined'){
					fo.sy = 1;
				}
				if(typeof fo.kx === 'undefined'){
					fo.kx = 0;
				}
				if(typeof fo.ky === 'undefined'){
					fo.ky = 0;
				}
				if(typeof fo.a === 'undefined'){
					fo.a = 1;
				}
				if(typeof fo.i === 'undefined'){
					fo.i = null;
				}
			}
			// Not first frame
			else{
				var lfo = to[f-1];
				if(typeof fo.f === 'undefined'){
					fo.f = lfo.f;
				}
				if(typeof fo.x === 'undefined'){
					fo.x = lfo.x;
				}
				if(typeof fo.y === 'undefined'){
					fo.y = lfo.y;
				}
				if(typeof fo.sx === 'undefined'){
					fo.sx = lfo.sx;
				}
				if(typeof fo.sy === 'undefined'){
					fo.sy = lfo.sy;
				}
				if(typeof fo.kx === 'undefined'){
					fo.kx = lfo.kx;
				}
				if(typeof fo.ky === 'undefined'){
					fo.ky = lfo.ky;
				}
				if(typeof fo.a === 'undefined'){
					fo.a = lfo.a;
				}
				if(typeof fo.i === 'undefined'){
					fo.i = lfo.i;
				}
			}
		}
	}
	
	// Iterate over each image and create a respectively image and source
	for(var im in images){
		var img = proj.createImage(im);
		var src = proj.createSource(img);
		images[im].img = img;
		images[im].src = src;
		images[im].index = proj.indexOfSource(src);
	}
	
	// Assign object and sources, and eliminates now animated symbols
	for(var i=0; i<tobjs.length; i++){
		if(tobjs[i].i){
			var obj = proj.createObject(tobjs[i].i.src, tobjs[i].name);
			tobjs[i].obj = obj;
		}
		else{
			tobjs.splice(i, 1);
			i--;
		}
	}
	
	// Iterate over each animation, and animate the objects
	if(tanims.length > 0){
		for(var a=0; a<tanims.length; a++){
			var anim = proj.createAnimation(tanims[a].name.replaceAll(/^anim_/g, ''));
			proj.moveAnimation(anim, 0);
			var ta = tanims[a].transforms;
			
			var first_f = -1;
			var state = -1; // States: -1 = Not started; 0 = In execution; 1 = Ended
			
			var tinc = [];
			
			for(var f=0; f<ta.length; f++){
				var fa = ta[f];
				
				// Not started
				if(state == (-1)){
					if((f==0 && fa.f!=(-1)) || (fa.f==0)){
						state = 0;
					}
				}
				// In execution
				if(state == 0){
					if(fa.f==(-1)){
						state = 1;
					}
					else{
						var frame = anim.addFrame();
						for(var o=0; o<tobjs.length; o++){
							// Include object
							if(tobjs[o].transforms[f].f != (-1) && !tinc.includes(tobjs[o])){
								tinc.push(tobjs[o]);
							}
							
							var obj = tobjs[o].obj;
							var fo = tobjs[o].transforms[f];
							var action = frame.createAction(obj);
							
							action.setVisible(fo.f != (-1));
							
							var transform = action.getTransform();
							
							var dx = 180 / Math.PI;
							var skewx = fo.kx/dx;
							var skewy = -fo.ky/dx;
							var sx = fo.sx;
							var sy = fo.sy;
							
							transform.a = Math.cos(skewx)*sx;
							transform.b = Math.sin(skewx)*sx;
							transform.c = Math.sin(skewy)*sy;
							transform.d = Math.cos(skewy)*sy;
							
							transform.x = fo.x;
							transform.y = fo.y;
							
							if(fo.i){
								action.setSource(images[fo.i].src);
							}
							action.getColor().a = fo.a;
							
						}
					}
				}
				// Ended
				if(state == 1){
					break;
				}
			}
			
			for(var o=0; o<tinc.length; o++){
				anim.includeObject(tinc[o].obj);
			}
			for(var o=0; o<tinc.length; o++){
				anim.moveIncludedObject(tinc[o].obj, tobjs.indexOf(tinc[o]));
			}
		}
	}
	else{
		var tinc = [];
		
		var anim = proj.createAnimation("main");
		for(var f=0; f<tobjs[0].transforms.length; f++){
			var frame = anim.addFrame();
			for(var o=0; o<tobjs.length; o++){
				// Include object
				if(tobjs[o].transforms[f].f != (-1) && !tinc.includes(tobjs[o])){
					tinc.push(tobjs[o]);
				}
				
				var obj = tobjs[o].obj;
				var fo = tobjs[o].transforms[f];
				var action = frame.createAction(obj);
				
				action.setVisible(fo.f != (-1));
				
				var transform = action.getTransform();
				
				var dx = 180 / Math.PI;
				var skewx = fo.kx/dx;
				var skewy = -fo.ky/dx;
				var sx = fo.sx;
				var sy = fo.sy;
				
				transform.a = Math.cos(skewx)*sx;
				transform.b = Math.sin(skewx)*sx;
				transform.c = Math.sin(skewy)*sy;
				transform.d = Math.cos(skewy)*sy;
				
				transform.x = fo.x;
				transform.y = fo.y;
				
				if(fo.i){
					action.setSource(images[fo.i].src);
				}
				action.getColor().a = fo.a;
			}
		}
		
		for(var o=0; o<tinc.length; o++){
			anim.includeObject(tinc[o].obj);
		}
		for(var o=0; o<tinc.length; o++){
			anim.moveIncludedObject(tinc[o].obj, tobjs.indexOf(tinc[o]));
		}
	}
	
	console.log(reanimdata);
	console.log("Done!");
}
