
function pamDecode(file){
	function _pamDecodeHeader(file){
		var header = {};
		header.magic = file.readString(4);
		header.version = file.read32();
		header.frame_rate = file.read8();
		header.position = [
			file.readS16()/20, file.readS16()/20
		]
		header.size = [
			file.readS16()/20, file.readS16()/20
		]
		return header;
	}

	function _pamDecodeImages(file, version){
		var total = file.read16();
		var images = [];
		for(var i=0; i<total; i++){
			var image = {};
			image.name = file.readString(file.read16());
			if(version >= 4){
				image.size = [file.readS16(), file.readS16()];
			}
			else{
				image.size = [-1, -1];
			}
			if(version==1){
				var rad = file.read16()/1000;
				image.transform = [
					Math.cos(rad),
					-Math.sin(rad),
					Math.sin(rad),
					Math.cos(rad),
					file.readS16() / 20,
					file.readS16() / 20,
				];
			}
			else{
				image.transform = [
					file.readS32() / 1310720,
					file.readS32() / 1310720,
					file.readS32() / 1310720,
					file.readS32() / 1310720,
					file.readS16() / 20,
					file.readS16() / 20,
				]
			}
			images.push(image);
		}
		return images;
	}

	function _pamDecodeSprite(file, version){
		var sprite = {};
		if(version >= 4){
			sprite.name = file.readString(file.read16());
			if(version >= 6){
				sprite.description = file.readString(file.read16());
			}
			sprite.frame_rate = file.read32()/65536;
		}
		var frames_count = file.read16();
		if(version >= 5){
			sprite.work_area = [
				file.read16(), file.read16()
			];
		}
		else{
			sprite.work_area = [
				0, frames_count - 1
			];
		}
		sprite.work_area[1] = frames_count;
		sprite.frames = [];
		for(var i=0; i<frames_count; i++){
			var frame = _pamDecodeFrameInfo(file, version);
			sprite.frames.push(frame);
		}
		return sprite;
	}

	function _pamDecodeFrameInfo(file, version){
		var frame = {};
		var flags = file.read8();
		
		// Remove status
		frame.remove = [];
		if(flags & 1){
			var remove_count = file.read8();
			if(remove_count==255){
				remove_count = file.read16();
			}
			for(var i=0; i<remove_count; i++){
				frame.remove.push(_pamDecodeRemoveInfo(file));
			}
		}
		
		// Append status
		frame.append = [];
		if(flags & 2){
			var append_count = file.read8();
			if(append_count==255){
				append_count = file.read16();
			}
			for(var i=0; i<append_count; i++){
				frame.append.push(_pamDecodeAppendInfo(file, version));
			}
		}
		
		// Change status
		frame.change = [];
		if(flags & 4){
			var change_count = file.read8();
			if(change_count==255){
				change_count = file.read16();
			}
			for(var i=0; i<change_count; i++){
				frame.change.push(_pamDecodeChangeInfo(file));
			}
		}
		
		// Label status
		if(flags & 8){
			frame.label = file.readString(file.read16());
		}
		
		// Stop status
		frame.stop = (flags & 16) != 0;
		
		// Command status
		frame.commands = [];
		if(flags & 32){
			var command_count = file.read8();
			for(var c=0; c< command_count; c++){
				frame.commands.push(_pamDecodeCommand(file));
			}
		}
		
		return frame;
	}

	function _pamDecodeRemoveInfo(file){
		var index = file.read16();
		if(index >= 2047){
			index = file.read32();
		}
		return index;
	}

	function _pamDecodeAppendInfo(file, version){
		var append = {};
		var number = file.read16();
		append.index = number & 2047;
		if(append.index == 2047){
			append.index = file.read32();
		}
		append.is_sprite = (number&32768) != 0;
		append.is_aditive = (number&16384) != 0;
		append.resource = file.read8();
		if(version >= 6 && append.resource==255){
			append.resource = file.read16();
		}
		append.preload_frame = 0;
		if((number&8192) != 0){
			append.preload_frame = file.read16();
		}
		if((number&4096) != 0){
			append.name = file.readString(file.read16());
		}
		append.time_scale = 1;
		if((number&2048) != 0){
			append.time_scale = file.read32() / 65536;
		}
		return append;
	}

	function _pamDecodeChangeInfo(file){
		var change = {};
		var flags = file.read16();
		change.index = flags & 1023;
		if(change.index == 1023){
			change.index = file.read32();
		}
		
		// Transform Matrix/Rotation flag
		change.transform = [0, 0, 0, 0, 0, 0];
		if(flags & 4096){
			change.transform[0] = file.readS32()/65536;
			change.transform[2] = file.readS32()/65536;
			change.transform[1] = file.readS32()/65536;
			change.transform[3] = file.readS32()/65536;
		}
		else if(flags & 16384){
			change.transform = [
				file.readS16() / 1000,
				0, 0
			];
		}
		else{
			change.transform = [0, 0];
		}
		
		// Transform Long Coords Flag
		if(flags & 2048){
			change.transform[change.transform.length - 2] = file.readS32() / 20;
			change.transform[change.transform.length - 1] = file.readS32() / 20;
		}
		else{
			change.transform[change.transform.length - 2] = file.readS16() / 20;
			change.transform[change.transform.length - 1] = file.readS16() / 20;
		}
		
		// Sprite Frame Flag
		if(flags & 32768){
			change.sprite_number_frame = [
				file.readS16() / 20,
				file.readS16() / 20,
				file.readS16() / 20,
				file.readS16() / 20,
			]
		}
		
		// Color Flag
		if(flags & 8192){
			change.color = [
				file.read8() / 255,
				file.read8() / 255,
				file.read8() / 255,
				file.read8() / 255,
			]
		}
		
		// Source Rectangle Flag
		if(flags & 1024){
			change.source_rectangle = file.read16();
		}
		
		return change;
	}

	function _pamDecodeCommand(file){
		return [
			file.readString(file.read16()),
			file.readString(file.read16())
		]
	}

	function _pamDecodeMainSprite(file, version, frame_rate){
		var main_sprite = {};
		if(version <= 3 || (file.read8()==1)){
			main_sprite = _pamDecodeSprite(file, version);
			main_sprite.frame_rate = frame_rate;
		}
		return main_sprite;
	}

	var pam = {};
	file.seekSet(0);
	pam.header = _pamDecodeHeader(file);
	pam.images = _pamDecodeImages(file, pam.header.version);
	{
		var sprite_count = file.read16();
		pam.sprites = [];
		for(var i=0; i<sprite_count; i++){
			var sprite = _pamDecodeSprite(file, pam.header.version);
			if(pam.header.version < 4){
				sprite.frame_rate = pam.header.frame_rate;
			}
			pam.sprites.push(sprite);
		}
	}
	pam.main_sprite = _pamDecodeMainSprite(file, pam.header.version, pam.header.frame_rate);
	return pam;
}

function pamToPaf(proj, pamdata, atlas){
	console.log(pamdata);
	
	function clone(item) {
		if (!item) { return item; } // null, undefined values check
		var types = [ Number, String, Boolean ], 
			result;
		// normalizing primitives if someone did new String('aaa'), or new Number('444');
		types.forEach(function(type) {
			if (item instanceof type) {
				result = type( item );
			}
		});
		if (typeof result == "undefined") {
			if (Object.prototype.toString.call( item ) === "[object Array]") {
				result = [];
				item.forEach(function(child, index, array) { 
					result[index] = clone( child );
				});
			} else if (typeof item == "object") {
				// testing that this is DOM
				if (item.nodeType && typeof item.cloneNode == "function") {
					result = item.cloneNode( true );    
				} else if (!item.prototype) { // check that this is a literal
					if (item instanceof Date) {
						result = new Date(item);
					} else {
						// it is an object literal
						result = {};
						for (var i in item) {
							result[i] = clone( item[i] );
						}
					}
				} else {
					// depending what you would like here,
					// just keep the reference, or create new object
					if (false && item.constructor) {
						// would not advice to do that, reason? Read below
						result = new item.constructor();
					} else {
						result = item;
					}
				}
			} else {
				result = item;
			}
		}
		return result;
	}
	
	//
	//	Setup Images
	//
	for(var i=0; i<pamdata.images.length; i++){
		for(var s=0; s<atlas.resources.length; s++){
			var res = atlas.resources[s];
			if(res.id==pamdata.images[i].name.split('|')[1]){
				pamdata.images[i].rect = new Rect(
					res.ax,
					res.ay,
					res.aw,
					res.ah
				);
				break;
			}
		}
	}
	
	//
	//	Setup Timeline
	//
	
	var area = {"s": pamdata.main_sprite.work_area[0], "e": pamdata.main_sprite.work_area[1]};
	
	function runThroughSprite(sprite){
		var timelines = [];
		var area = {"s": sprite.work_area[0], "e": sprite.work_area[1]};
		
		// Fill the entire work area
		for(var f=area.s; f<area.e; f++){
			var lframe = f>0? sprite.frames[f-1]: {"stop":false};
			var frame = sprite.frames[f];
			
			// Replicate the latest frame
			for(var t=0; t<timelines.length; t++){
				var timeline = timelines[t];
				
				if(timeline){
					timeline.frames[f] = null;
				}
			}
			
			// Removes
			for(var r=0; r<frame.remove.length; r++){
				var t = frame.remove[r];
				var timeline = timelines[t];
				
				timeline.frames[f] = 0;
			}
			
			// Appends
			for(var a=0; a<frame.append.length; a++){
				var append = frame.append[a];
				var t = append.index;
				var timeline = {
					"name": sprite.name,
					"append": clone(append),
					"area": [],
					"frames": []
				};
				
				for(var s=0; s<area.e; s++){
					timeline.frames[s] = null;
				}
				timelines[t] = timeline;
			}
			
			// Changes
			for(var c=0; c<frame.change.length; c++){
				var change = frame.change[c];
				var t = change.index;
				var timeline = timelines[t];
				
				timeline.frames[f] = {
					"change": clone(change)
				};
			}
		}
		
		// Iterate
		for(var t=0; t<timelines.length; t++){
			var timeline = timelines[t];
			
			// Setup the boundary
			for(var f=area.s; f<area.e; f++){
				var frame = timeline.frames[f];
				
				if(timeline.area.length==0){
					if(frame){
						timeline.area.push(f);
					}
				}
				else if(timeline.area.length==1){
					if(frame==0){
						timeline.area.push(f-1);
					}
					else{
						var lchg = timeline.frames[f-1]? clone(timeline.frames[f-1].change): {};
						var achg = frame? clone(frame.change): {};
						timeline.frames[f] = {
							"change": Object.assign(lchg, achg)
						};
					}
				}
			}
			if(timeline.area.length==1){
				timeline.area.push(area.e-1);
			}
			
			// Set the base changes
			for(var f=area.s; f<area.e; f++){
				var frame = timeline.frames[f];
				
				if(frame){
					var ap = frame.change;
					
					if(ap.transform){
						var tr = ap.transform;
						if(tr.length==2){
							frame.transform = new Matrix3x2(
								1, 0, 0, 1,
								tr[0], tr[1]);
						}
						else if(tr.length==3){
							frame.transform = new Matrix3x2(
								Math.cos(-tr[0]), -Math.sin(-tr[0]), Math.sin(-tr[0]), Math.cos(-tr[0]),
								tr[1], tr[2]);
						}
						else{
							frame.transform = new Matrix3x2(
								tr[0], tr[1], tr[2],
								tr[3], tr[4], tr[5]);
						}
					}
					else{
						frame.transform = new Matrix3x2(1, 0, 0, 1, 0, 0);
					}
					
					if(ap.color){
						frame.color = new Color(ap.color[0], ap.color[1], ap.color[2], ap.color[3]);
					}
					else{
						frame.color = new Color(1, 1, 1, 1);
					}
					
					{
						var mat = frame.transform.clone();
						mat.src = "self-frame";
						frame.combine = [mat];
					}
					
				}
			}
		}
		
		// Iterate, do some adjustes over timelines and normalizations
		for(var t=0; t<timelines.length; t++){
			var timeline = timelines[t];
			
			// Setups the children of current timeline
			if(timeline.append.is_sprite){
				var children = runThroughSprite(pamdata.sprites[timeline.append.resource]);
				
				// Setup and inserts each child timeline
				for(var c=0; c<children.length; c++){
					var child = children[c];
					child.name = child.name||timeline.name;
					
					// Insert before frames
					for(var f=0; f<timeline.area[0]; f++){
						child.frames.splice(f, 0, null);
					}
					
					// Complement inner frames
					for(var f=timeline.area[0]; f<=timeline.area[1]; f++){
						if(!child.frames[f]){
							if(f!=timeline.area[0]){
								var frame = clone(child.frames[f-1]);
								
								// Recovering Objects from Deep Copy
								if(frame){
									if(frame.combine){
										for(var i=0; i<frame.combine.length; i++){
											frame.combine[i] = new Matrix3x2(
												frame.combine[i].a, frame.combine[i].b, frame.combine[i].c,
												frame.combine[i].d, frame.combine[i].x, frame.combine[i].y
											);
										}
									}
									frame.transform = new Matrix3x2(
										frame.transform.a, frame.transform.b, frame.transform.c,
										frame.transform.d, frame.transform.x, frame.transform.y
									);
									frame.color = new Color(
										frame.color.r, frame.color.g, frame.color.b, frame.color.a
									);
								}
								
								child.frames.push(frame);
							}
							else{
								child.frames.push(null);
							}
						}
					}
					child.frames.length = timeline.area[1]+1;
					
					// Complement after frames
					for(var f=timeline.area[1]+1; f<area.e; f++){
						child.frames.push(null);
					}
					
					// Set the apply changes
					for(var f=area.s; f<area.e; f++){
						var tframe = timeline.frames[f];
						var cframe = child.frames[f];
						
						// Combine transformations
						if(cframe){
							//cframe.transform.set(tframe.transform.clone().mul(cframe));
							cframe.transform.mul(tframe.transform);
							cframe.combine.push(tframe.transform.clone());
							
							cframe.color.r *= tframe.color.r;
							cframe.color.g *= tframe.color.g;
							cframe.color.b *= tframe.color.b;
							cframe.color.a *= tframe.color.a;
						}
					}
					
					child.area[0] = timeline.area[0];
					child.area[1] = timeline.area[1];
					
					timelines.splice(t+c+1, 0, child);
				}
				
				// Removes the current timeline
				timelines.splice(t, 1);
				t--;
				t += children.length;
			}
			// Setup just the current timeline with its image
			else{
				timeline.image = pamdata.images[timeline.append.resource];
				
				// Set the base changes
				for(var f=area.s; f<area.e; f++){
					var frame = timeline.frames[f];
					
					if(frame){
						frame.transform = new Matrix3x2(1, 0, 0, 1, 0, 0);
						/*
						var matScale = (new Matrix3x2()).setScale(
							timeline.image.size[0]/timeline.image.rect.w,
							timeline.image.size[1]/timeline.image.rect.h
						);
						*/
						{
							var mat = new Matrix3x2(
								timeline.image.transform[0], timeline.image.transform[1], timeline.image.transform[2],
								timeline.image.transform[3], timeline.image.transform[4], timeline.image.transform[5]
							).clone();
							mat.src = "img-matrix";
							frame.combine.unshift(mat);
						}
						
						{
							var mat = (new Matrix3x2()).setScale(
								timeline.image.size[0]/timeline.image.rect.w,
								timeline.image.size[1]/timeline.image.rect.h
							);;
							mat.src = "img-scale";
							frame.combine.unshift(mat);
						}
						/*
						var combMat = matScale.mul(new Matrix3x2(
							timeline.image.transform[0], timeline.image.transform[1], timeline.image.transform[2],
							timeline.image.transform[3], timeline.image.transform[4], timeline.image.transform[5]
						));
						frame.transform.set(combMat.mul(frame.transform));
						*/
						//frame.transform.mul(combMat);
					}
				}
			}
			
		}
		
		return timelines;
	}
	let timelines = runThroughSprite(pamdata.main_sprite);
	
	// Retrieve each animation and info
	var tags = [];
	for(var f=area.s; f<area.e; f++){
		if(pamdata.main_sprite.frames[f].label){
			tags.push([pamdata.main_sprite.frames[f].label, f, f, []]);
		}
		if(pamdata.main_sprite.frames[f].stop){
			tags[tags.length-1][2] = f;
		}
	}
	for(var t=0; t<timelines.length; t++){
		for(var a=0; a<tags.length; a++){
			//console.log("Compare "+t+"::["+timelines[t].area+"] to \""+tags[a][0]+"\"["+[tags[a][1], tags[a][2]]+"]");
			if((timelines[t].area[0]>=tags[a][1] && timelines[t].area[0]<=tags[a][2]) ||
				(timelines[t].area[1]>=tags[a][1] && timelines[t].area[1]<=tags[a][2]) ||
				(tags[a][1]>=timelines[t].area[0] && tags[a][1]<=timelines[t].area[1]) ||
				(tags[a][2]>=timelines[t].area[0] && tags[a][2]<=timelines[t].area[1])){
				//console.log("True");
				tags[a][3].push(timelines[t]);
			}
		}
	}
	
	// Generate animations
	proj.createImage("atlas");
	for(var s=0; s<atlas.resources.length; s++){
		var res = atlas.resources[s];
		var source = proj.createSource(proj.getImage(0), new Rect(0, 0, 1, 1));
		source.getRect().x = isNaN(res.ax)? 0: res.ax;
		source.getRect().y = isNaN(res.ay)? 0: res.ay;
		source.getRect().w = isNaN(res.aw)? 1: res.aw;
		source.getRect().h = isNaN(res.ah)? 1: res.ah;
	}
	
	//new Blah();
	
	// Setup Project Animations
	for(var a=0; a<tags.length; a++){
		var tag = tags[a];
		var anim = proj.createAnimation(tag[0]);
		
		let timelines = tag[3];
		// Setup objects in Animation
		for(var o=0; o<timelines.length; o++){
			var timeline = timelines[o];
			
			// Setup Source
			var source = null;
			for(var s=0; s<atlas.resources.length; s++){
				var res = atlas.resources[s];
				if(res.id==timeline.image.name.split('|')[1]){
					source = proj.getSource(s);
					break;
				}
			}
			
			// Setup Object
			var object = proj.createObject(source, timeline.name||timeline.image.name.split('|')[0]);
			anim.includeObject(object);
			timeline.object = object;
		}
		
		// SETUP FRAMES
		for(var f=tag[1]; f<=tag[2]; f++){
			var f_i = f-tag[1];
			var frame = anim.addFrame();
			
			for(var r=0; r<timelines.length; r++){
				var tm = timelines[r];
				var fr = tm.frames[f];
				var obj = tm.object;
				var action = frame.getAction(obj)||frame.createAction(obj);
				
				action.setVisible(fr!=null);
				
				if(fr){
					var mat = new Matrix3x2();
					for(var i=0; i<fr.combine.length; i++){
						mat.mul(fr.combine[i]);
					}
					action.getTransform().set(mat);
					//action.getTransform().set(fr.combine[0].mul(fr.transform).mul(fr.combine[1]).mul(fr.combine[2]));
					action.getColor().set(fr.color);
				}
			}
		}
	}
	
	console.log(timelines);
	console.log(tags);
	console.log("Done!");
}

function _pamToPaf(proj, _pam, _atlas){
	
	var out = {};

	/**
		UTILITIES
	*/

	function duplicateObject(item) {
		if (!item) { return item; } // null, undefined values check
		var types = [ Number, String, Boolean ], 
			result;
		// normalizing primitives if someone did new String('aaa'), or new Number('444');
		types.forEach(function(type) {
			if (item instanceof type) {
				result = type( item );
			}
		});
		if (typeof result == "undefined") {
			if (Object.prototype.toString.call( item ) === "[object Array]") {
				result = [];
				item.forEach(function(child, index, array) { 
					result[index] = duplicateObject( child );
				});
			} else if (typeof item == "object") {
				// testing that this is DOM
				if (item.nodeType && typeof item.cloneNode == "function") {
					result = item.cloneNode( true );    
				} else if (!item.prototype) { // check that this is a literal
					if (item instanceof Date) {
						result = new Date(item);
					} else {
						// it is an object literal
						result = {};
						for (var i in item) {
							result[i] = duplicateObject( item[i] );
						}
					}
				} else {
					// depending what you would like here,
					// just keep the reference, or create new object
					if (false && item.constructor) {
						// would not advice to do that, reason? Read below
						result = new item.constructor();
					} else {
						result = item;
					}
				}
			} else {
				result = item;
			}
		}
		return result;
	}
	
	function pushIfNotInArray(arr, value){
		if(!arr.includes(value)){
			arr.push(value);
		}
	}

	function matrix_mul(mt1, mt2){
		var rmat = (new Matrix3x2(mt1[0], mt1[1], mt1[2], mt1[3], mt1[4], mt1[5])).mul(new Matrix3x2(mt2[0], mt2[1], mt2[2], mt2[3], mt2[4], mt2[5]));
		return [rmat.a, rmat.b, rmat.c, rmat.d, rmat.x, rmat.y];
	}

	function matrix_fromScale(x, y){
		return [x, 0, 0, y, 0, 0];
	}

	function matrix_fromTranslation(x, y){
		return [1, 0, 0, 1, x, y];
	}

	function matrix_fromRotation(rad){
		return [Math.cos(rad), -Math.sin(rad), Math.sin(rad), Math.cos(rad), 0, 0];
	}

	function matrix_fromTransform(tr){
		var transform = [1, 0, 0, 1, 0, 0];
		if(tr.length==2){
			transform[4] = tr[0];
			transform[5] = tr[1];
		}
		else if(tr.length==3){
			transform = [
				Math.cos(-tr[0]), -Math.sin(-tr[0]),
				Math.sin(-tr[0]), Math.cos(-tr[0]),
				tr[1], tr[2]
			];
		}else{
			transform = tr;
		}
		return transform;
	}

	function color_fromTransform(color){
		return !color ? [1, 1, 1, 1] : color;
	}

	function color_mul(c1, c2){
		return [c1[0]*c2[0], c1[1]*c2[1], c1[2]*c2[2], c1[3]*c2[3]];
	}


	/**
		LOADING ATLAS COMPONENTS
	*/

	var images = {};

	// Ripping images sources
	for(var ri=0; ri<_atlas.resources.length; ri++){
		var res = _atlas.resources[ri];
		if(!res.atlas){
			var name = res.path.split("\\").pop();
			images[name] = {
				"name": name,
				"rect": [res.ax, res.ay, res.aw, res.ah]
			};
		}
	}

	// Reasigning images properties
	out.images = _pam.images;
	for(var im=0; im<_pam.images.length; im++){
		var img = _pam.images[im];
		var image = images[img.name.split("|")[0]];
		if(image){
			img.rect = image.rect;
		}
	}

	/*
		ANIMATION UTILITIES
	*/


	/*
		GENERATING LAYERS ANIMATIONS
	*/

	var animation = {};
	var a_master = [];
	animation.master = a_master;
	var a_layers = [];

	function iterateSprite(sprite, frame_offset, out_layers, outmaster_layer, sub){
		var timelines = [];
		
		// Local constants
		const ANIM_ACTION_APPEND = "appends";
		const ANIM_ACTION_REMOVE = "removes";
		const ANIM_ACTION_CHANGE = "changes";
		
		// Function for dinamically insert frames into Timeline
		function addToTimeline(timelines_index, frame_index, data, action){
			if(!timelines[timelines_index]){
				timelines[timelines_index] = {"frames":[], "bounds":[Infinity, -Infinity]};
			}
			timelines[timelines_index][action] = (timelines[timelines_index][action]||0) + 1;
			timelines[timelines_index].frames[frame_index] = data;
			// Setting boundaries for timelines
			if(frame_index<timelines[timelines_index].bounds[0]){
				timelines[timelines_index].bounds[0] = frame_index;
			}
			if(frame_index>timelines[timelines_index].bounds[1]){
				timelines[timelines_index].bounds[1] = frame_index;
			}
		}
		// Function for retrieve the frame at Timeline
		function getFromTimeline(timelines_index, frame_index){
			if(timelines[timelines_index] && timelines[timelines_index].frames[frame_index]){
				return timelines[timelines_index].frames[frame_index];
			}
			return {};
		}
		// Function for retrieve the Timeline
		function getTimeline(timelines_index){
			if(timelines[timelines_index]){
				return timelines[timelines_index];
			}
			throw new Error("Create a Timeline first!");
		}
		
		// Retrieving the timelines
		for(var fi=0; fi<sprite.frames.length; fi++){
			var _frame = sprite.frames[fi];
			
			// Emiting the master properties
			outmaster_layer[fi + frame_offset] = {
				"label": _frame.label,
				"stop": _frame.stop,
				"command": _frame.command
			};
			
			// Iterare over Appends
			for(var ai=0; ai<_frame.append.length; ai++){
				var _app = _frame.append[ai];
				var index = _app.index;
				
				// Retrieve and insert to timelines
				var tdata = getFromTimeline(index, fi + frame_offset);
				tdata._append = _app;
				addToTimeline(index, fi + frame_offset, tdata, ANIM_ACTION_APPEND);
				
				// Setup append index for timeline
				getTimeline(index).setup = _app;
			}
			
			// Iterare over Removes
			for(var ri=0; ri<_frame.remove.length; ri++){
				var _rem = _frame.remove[ri];
				var index = _rem;
				
				// Retrieve and insert to timelines
				var tdata = getFromTimeline(index, fi + frame_offset);
				tdata._remove = _rem;
				addToTimeline(index, fi + frame_offset, tdata, ANIM_ACTION_REMOVE);
			}
			
			// Iterare over Changes
			for(var ci=0; ci<_frame.change.length; ci++){
				var _chg = _frame.change[ci];
				var index = _chg.index;
				
				// Retrieve and insert to timelines
				var tdata = getFromTimeline(index, fi + frame_offset);
				tdata._change = _chg;
				addToTimeline(index, fi + frame_offset, tdata, ANIM_ACTION_CHANGE);
			}
		}
		
		// Distributing the timelines as layers
		for(var ti=0; ti<timelines.length; ti++){
			var timeline = timelines[ti];
			
			if(timeline){
				timeline.depth = sub;
				
				// Normalizating frames
				for(var fi=0; fi<=a_master.length; fi++){
					var frame = timeline.frames[fi];
					var lframe = fi==0? {"enabled":false, "transform":[1, 0, 0, 1, 0, 0], "color":[1, 1, 1, 1]} : timeline.frames[fi-1];
					
					// A non frame receive a clone of previous
					if(!frame){
						frame = duplicateObject(lframe);
					}
					// In case of removing frame, disable the frame
					if(frame._remove){
						frame.enabled = false;
					}
					// Otherwise, utilizes the enabled flag from last frame to normalize
					else{
						frame.enabled = lframe.enabled;
					}
					// In case of append frame, reenable the frame, it has high priority
					if(frame._append){
						frame.enabled = true;
					}
					
					// Normalize transform property, a must have one
					if(frame._change && frame._change.transform){
						frame.transform = duplicateObject(frame._change.transform);
					}
					else if(!frame.transform){
						frame.transform = lframe.transform;
					}
					
					// Normalize matrices property, a debug one
					if(!frame.matrices){
						frame.matrices = [];//frame.transform];
					}
					
					// Normalize color property, a must have one
					if(frame._change && frame._change.color){
						frame.color = color_fromTransform(duplicateObject(frame._change.color));
					}
					else if(!frame.color){
						frame.color = lframe.color;
					}
					
					frame.depth = sub;
					
					// Reassign to save the frame
					timeline.frames[fi] = frame;
				}
				
				// In case of resource of the layer is another sprite
				if(timeline.setup.is_sprite){
					//out_layers.push(timeline);
					
					// Gather each child layer
					var child_layers = [];
					iterateSprite(_pam.sprites[timeline.setup.resource], 0, child_layers, [], sub+1);
					
					// Save up, do any operation as needed and retrives back to father layer
					for(var li=0; li<child_layers.length; li++){
						var layer = child_layers[li];
						
						var out_frames = [];
						
						// Renormalizating transforms for children
						for(var fi=0; fi<=a_master.length; fi++){
							var f_frame = timeline.frames[fi];
							var frame;
							if(fi < timeline.bounds[0]){
								frame = {"enabled":false, "transform":[1, 0, 0, 1, 0, 0], "matrices":[], "color":[1, 1, 1, 1]};
								var mat = matrix_mul(
									matrix_fromScale(
									_pam.images[layer.setup.resource].size[0]/_pam.images[layer.setup.resource].rect[2],
									_pam.images[layer.setup.resource].size[1]/_pam.images[layer.setup.resource].rect[3]),
									_pam.images[layer.setup.resource].transform);
								try{
									mat = matrix_mul(mat, layer.frames[layer.bounds[1]].transform);
								}
								catch(err){}
								frame.transform = matrix_mul(mat, matrix_fromTransform(frame.transform));
							}
							else if((fi - timeline.bounds[0]) > layer.bounds[1]){
								frame = duplicateObject(layer.frames[layer.bounds[1]]);
							}
							else{
								frame = duplicateObject(layer.frames[fi - timeline.bounds[0]]);
							}
							frame.enabled = f_frame.enabled;
							
							out_frames[fi] = frame;
						}
						
						for(var fi=0; fi<=a_master.length; fi++){
							var f_frame = timeline.frames[fi];
							var frame = out_frames[fi];
							
							frame.transform = matrix_mul(frame.transform, matrix_fromTransform(f_frame.transform));
							frame.color = color_mul(frame.color, f_frame.color);
							
							layer.frames[fi] = frame;
						}
						layer.bounds[0] = timeline.bounds[0];
						layer.bounds[1] = timeline.bounds[1];
						
						out_layers.push(layer);
					}
				}
				else{
					for(var fi=0; fi<=a_master.length; fi++){
						var frame = timeline.frames[fi];
						var mat = matrix_mul(
							matrix_fromScale(
							_pam.images[timeline.setup.resource].size[0]/_pam.images[timeline.setup.resource].rect[2],
							_pam.images[timeline.setup.resource].size[1]/_pam.images[timeline.setup.resource].rect[3]),
							_pam.images[timeline.setup.resource].transform);
						frame.transform = matrix_mul(mat, matrix_fromTransform(frame.transform));
					}
					
					timeline.name = _pam.images[timeline.setup.resource].name.split("|")[0];
					out_layers.push(timeline);
				}
			}
		}
	}
	
	var dbg = 0;

	// Call for main sprite in pam
	iterateSprite(_pam.main_sprite, 0, a_layers, a_master, 0);


	/*
		MERGING SAMED LAYERS
	*/

	var m_layers = [];
	animation.layers = m_layers;

	// Setup a layer to use as base for comparisions
	function setupLayerComparation(base){
		base.periods = [[base.bounds[0], base.bounds[1]]];
	}

	// Comparate two layers if they are compatible
	function comparateLayers(base, target){
		return false;
		// Mostly properties of setup must be equal
		if((base.setup.resource!=target.setup.resource) ||
			(base.setup.is_sprite!=target.setup.is_sprite) ||
			(base.setup.additive!=target.setup.additive) ||
			(base.setup.preload_frames!=target.setup.preload_frames) ||
			(base.setup.timescale!=target.setup.timescale)){
			return false;
		}
		// Now, comparates if has collision with periods
		for(var pi=0; pi<base.periods.length; pi++){
			var period = base.periods[pi];
			// Comparate begin offset
			if(target.bounds[0]>=period[0] && target.bounds[0]<period[1]){
				return false;
			}
			if(target.bounds[1]>=period[0] && target.bounds[1]<period[1]){
				return false;
			}
		}
		// Otherwise, adds as a new collider to layer, and return true
		base.periods.push(target.bounds);
		return true;
	}

	// Merging equally layers
	while(a_layers.length > 0){
		var base_cmp = null
		var equals = [];
		
		// Adding equal layers
		for(var li=0; li<a_layers.length; li++){
			if(base_cmp){
				if(comparateLayers(base_cmp, a_layers[li])){
					equals.push(a_layers[li]);
					a_layers.splice(li, 1);
					li--;
					continue;
				}
				else{
					continue;
				}
			}
			else{
				base_cmp = a_layers[li];
				equals.push(a_layers[li]);
				setupLayerComparation(base_cmp);
				a_layers.splice(li, 1);
				li--;
				continue;
			}
		}
		
		// Merging layers into one (the first)
		var base_layer = equals[0];
		for(var ei=1; ei<equals.length; ei++){
			var layer = equals[ei];
			// Merging frames
			for(var fi=layer.bounds[0]; fi<=layer.bounds[1]; fi++){
				if(layer.frames[fi]){
					base_layer.frames[fi] = layer.frames[fi];
				}
			}
			// Merging bounds
			if(layer.bounds[0]<base_layer.bounds[0]){
				base_layer.bounds[0] = layer.bounds[0];
			}
			if(layer.bounds[1]>base_layer.bounds[1]){
				base_layer.bounds[1] = layer.bounds[1];
			}
		}
		
		// Saving up the merged result
		m_layers.push(equals[0]);
	}


	/*
		PAF Encoder
	*/

	function templatePAF(){
		return {
			"images": [],
			"srcs": [],
			"objects": [],
			"animations": []
		};
	}


	/*
		EXPORTING TO PAF FORMAT
	*/
	
	proj.createImage("atlas");

	for(var si=0; si<_pam.images.length; si++){
		var source = proj.createSource(proj.getImage(0), new Rect(
			_pam.images[si].rect[0],
			_pam.images[si].rect[1],
			_pam.images[si].rect[2],
			_pam.images[si].rect[3]));
	}

	for(var li=0; li<m_layers.length; li++){
		var object = proj.createObject(proj.getSource(m_layers[li].setup.resource), m_layers[li].name);
	}

	var cur_anim = "_";
	var anim = null;
	var inc_obj = [];
	for(var fi=0; fi<a_master.length; fi++){
		if(a_master[fi].label){
			cur_anim = a_master[fi].label+"";
			if(anim){
				for(var o=0; o<inc_obj.length; o++){
					anim.includeObject(inc_obj[o]);
				}
			}
			anim = proj.createAnimation(cur_anim);
			inc_obj = [];
		}
		var frame = anim.addFrame();
		
		for(var li=0; li<m_layers.length; li++){
			var obj = proj.getObject(li);
			var layer = m_layers[li];
			
			var action = frame.createAction(obj);
			action.setVisible(false);
			
			if(layer.frames[fi] && layer.frames[fi].enabled){
				if(!inc_obj.includes(obj)){
					inc_obj.push(obj);
				}
				var transform = matrix_fromTransform(layer.frames[fi].transform);
				for(var i=0; i<layer.frames[fi].matrices.length; i++){
					//
					// MATRIX MULTIPLICATION This order:
					// resize * image * sprite * change
					//
				}
				
				var color = /*color_unpack(*/layer.frames[fi].color/*)*/;
				
				action = frame.getAction(obj);
				action.setVisible(true);
				action.getTransform().set(transform[0], transform[1], transform[2], transform[3], transform[4], transform[5]);
				action.getColor().set(color[0], color[1], color[2], color[3]);
			}
		}
	}
	for(var o=0; o<inc_obj.length; o++){
		anim.includeObject(inc_obj[o]);
	}
	console.log("Done!");
}
