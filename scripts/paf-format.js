

const PAFImport = (new function(){
	var self = this;
	
	self.export = function(proj, options={}){
		proj.cleanup();
		
		// Generating binary
		var file = File.openBuffer(new Array(0));
		file.fixed = false;
		file.name = "project.paf";
		
		// Sumary
		file.writeString("MPAF");
		file.write32(0x02);
		file.write32(proj.project_version);
		file.write8(proj.fps);
		file.write32(0);
		file.write32(0);
		file.write32(0);
		file.write32(0);
		
		// Image
		var img_seek = file.tell();
		file.write16(proj.getTotalImages());
		for(var s=0; s<proj.getTotalImages(); s++){
			var img = proj.getImage(s);
			img.setMeta("_index", s);
			file.write8(img.getName().length);
			file.writeString(img.getName());
			if(options.include_images_data){
				var data = img.getThumb().getImageData();
				file.write32(data.length);
				for(var d=0; d<data.length; d++){
					file.write8(data[d]);
				}
			}
			else{
				file.write32(0);
			}
		}
		
		// Src
		var src_seek = file.tell();
		file.write16(proj.getTotalSources());
		for(var s=0; s<proj.getTotalSources(); s++){
			var src = proj.getSource(s);
			src.setMeta("_index", s);
			file.write16(src.getImage().getMeta("_index"));
			file.write16(src.getRect().x);
			file.write16(src.getRect().y);
			file.write16(src.getRect().w);
			file.write16(src.getRect().h);
		}
		
		// Objects
		var obj_seek = file.tell();
		file.write16(proj.getTotalObjects());
		for(var o=0; o<proj.getTotalObjects(); o++){
			var obj = proj.getObject(o);
			obj.setMeta("_index", o);
			file.write16(obj.getSource().getMeta("_index"));
			file.write8(obj.getName().length);
			file.writeString(obj.getName());
		}
		
		// Animations
		var anim_seek = file.tell();
		file.write16(proj.getTotalAnimations());
		for(var a=0; a<proj.getTotalAnimations(); a++){
			var anim = proj.getAnimation(a);
			file.write8(anim.getName().length);
			file.writeString(anim.getName());
			
			var inc = anim.getIncludedObjects();
			file.write16(inc.length);
			for(var i=0; i<inc.length; i++){
				var ref = inc[i].getMeta("_index");
				file.write16(ref);
			}
			
			file.write32(anim.getTotalFrames());
			for(var f=0; f<anim.getTotalFrames(); f++){
				var frame = anim.getFrame(f);
				var lframe = f>0? anim.getFrame(f-1):null;
				
				var actions = frame.getAllActions();
				
				file.write16(actions.length);
				for(var c=0; c<actions.length; c++){
					var action = actions[c];
					var laction = lframe? lframe.getAction(action.getObject()): null;
					var reference = anim.indexOfIncludedObject(action.getObject());
					
					var equal_scale = laction &&
						(laction.getTransform().a==action.getTransform().a) &&
						(laction.getTransform().b==action.getTransform().b) &&
						(laction.getTransform().c==action.getTransform().c) &&
						(laction.getTransform().d==action.getTransform().d);
					var equal_translate = laction &&
						(laction.getTransform().x==action.getTransform().x) &&
						(laction.getTransform().y==action.getTransform().y);
					var equal_color = laction &&
						(laction.getColor().r==action.getColor().r) &&
						(laction.getColor().g==action.getColor().g) &&
						(laction.getColor().b==action.getColor().b) &&
						(laction.getColor().a==action.getColor().a);
					
					var flag_visible = (action.isVisible()? 0x01: 0x00);
					var flag_trigger = (action.getTrigger()!=null && action.getTrigger()!=''? 0x02: 0x00);
					var flag_source = (f==0 || (laction.getSource()!=action.getSource())? 0x04: 0x00);
					var flag_scale = (f==0 || !equal_scale? 0x08: 0x00);
					var flag_translate = (f==0 || !equal_translate? 0x10: 0x00);
					var flag_colorize = (f==0 || !equal_color? 0x20: 0x00);
					var flag_flipx = (action.isFlipX()? 0x40: 0x00);
					var flag_flipy = (action.isFlipY()? 0x80: 0x00);
					
					file.write16(reference);
					file.write8(flag_visible|flag_trigger|flag_source|flag_scale|flag_translate|flag_colorize|flag_flipx|flag_flipy);
					if(flag_trigger){
						file.write8(action.getTrigger().length);
						file.writeString(action.getTrigger());
					}
					if(flag_source){
						file.write16(action.getSource().getMeta("_index"));
					}
					if(flag_scale){
						file.writeFloat32(action.getTransform().a);
						file.writeFloat32(action.getTransform().b);
						file.writeFloat32(action.getTransform().c);
						file.writeFloat32(action.getTransform().d);
					}
					if(flag_translate){
						file.writeFloat32(action.getTransform().x);
						file.writeFloat32(action.getTransform().y);
					}
					if(flag_colorize){
						file.write8(action.getColor().r*255);
						file.write8(action.getColor().g*255);
						file.write8(action.getColor().b*255);
						file.write8(action.getColor().a*255);
					}
				}
			}
		}
		
		//file.fixed = true;
		file.seekSet(13);
		file.write32(img_seek);
		file.write32(src_seek);
		file.write32(obj_seek);
		file.write32(anim_seek);
		
		console.log("Generating binary file of size: "+file.size()+" bytes");
		file.saveAsBinary();
	}
	
	self.import = function(proj, file){
		if(file.readString(4)!="MPAF"){
			throw new Error("Invalid File Type!");
		}
		var format_version = file.read32();
		if(format_version!=2){
			throw new Error("Invalid Version Format!");
		}
		var project_version = file.read32();
		proj.project_version = project_version;
		proj.fps = file.read8();
		
		var img_seek = file.read32();
		var src_seek = file.read32();
		var obj_seek = file.read32();
		var anim_seek = file.read32();
		
		// Image
		file.seekSet(img_seek);
		var count_img = file.read16();
		for(var s=0; s<count_img; s++){
			var name = file.readString(file.read8());
			proj.createImage(name);
			var data_length = file.read32();
			while(data_length>0){
				proj.read8();
				data_length--;
			}
		}
		
		// Src
		file.seekSet(src_seek);
		var count_src = file.read16();
		for(var s=0; s<count_src; s++){
			proj.createSource(
				proj.getImage(file.read16()),
				new Rect(file.read16(), file.read16(), file.read16(), file.read16())
			);
		}
		
		// Objects
		file.seekSet(obj_seek);
		var count_obj = file.read16();
		for(var s=0; s<count_obj; s++){
			proj.createObject(
				proj.getSource(file.read16()),
				file.readString(file.read8())
			);
		}
		
		// Animations
		file.seekSet(anim_seek);
		var count_anim = file.read16();
		for(var a=0; a<count_anim; a++){
			var name = file.readString(file.read8());
			var anim = proj.createAnimation(name);
			
			var count_ref = file.read16();
			for(var r=0; r<count_ref; r++){
				var ref = file.read16();
				if(!proj.getObject(ref)){
					throw new Error("Invalid Object Index!");
				}
				anim.includeObject(proj.getObject(ref));
			}
			var inc = anim.getIncludedObjects();
			
			var count_frames = file.read32();
			for(var f=0; f<count_frames; f++){
				var frame = anim.addFrame();
				var count_actions = file.read16();
				for(var c=0; c<count_actions; c++){
					var ref = file.read16();
					var obj = inc[ref];
					var flags = file.read8();
					if(!obj){
						throw new Error("Invalid Reference Index!");
					}
					var action = obj? frame.createAction(obj): {"setVisible":function(){},"setTrigger":function(){},"setSource":function(){},"getTransform":function(){return{};},"getColor":function(){return{};},"setFlipX":function(){},"setFlipY":function(){},};
					
					// Visible flag
					action.setVisible((flags&0x01) != 0);
					
					// Trigger flag
					if((flags&0x02) != 0){
						action.setTrigger(file.readString(file.read8()));
					}
					else{
						action.setTrigger(null);
					}
					
					// Source flag
					if((flags&0x04) != 0){
						action.setSource(proj.getSource(file.read16()));
					}
					
					// Scale/Rotation flag
					if((flags&0x08) != 0){
						var tr = action.getTransform();
						tr.a = file.readFloat32();
						tr.b = file.readFloat32();
						tr.c = file.readFloat32();
						tr.d = file.readFloat32();
					}
					
					// Translate flag
					if((flags&0x10) != 0){
						var tr = action.getTransform();
						tr.x = file.readFloat32();
						tr.y = file.readFloat32();
					}
					
					// Colorize flag
					if((flags&0x20) != 0){
						var col = action.getColor();
						col.r = file.read8()/255;
						col.g = file.read8()/255;
						col.b = file.read8()/255;
						col.a = file.read8()/255;
					}
					
					// Visible flag
					action.setFlipX((flags&0x40) != 0);
					
					// Visible flag
					action.setFlipY((flags&0x80) != 0);
				}
			}
		}
		
		/*
		// Animations
		var anim_seek = file.tell();
		file.write16(proj.getTotalAnimations());
		for(var a=0; a<proj.getTotalAnimations(); a++){
			var anim = proj.getAnimation(a);
			file.write8(anim.getName().length);
			file.writeString(anim.getName());
			
			var inc = anim.getIncludedObjects().length;
			file.write16(inc.length);
			for(var i=0; i<inc.length; i++){
				file.write16(inc[i].getMeta("_index"));
			}
			
			file.write32(anim.getTotalFrames());
			for(var f=0; f<anim.getTotalFrames(); f++){
				var frame = anim.getFrame(f);
				var lframe = f>0? anim.getFrame(f-1):null;
				var actions = frame.getAllActions();
				file.write16(actions.length);
				for(var c=0; c<actions.length; c++){
					var action = actions[c];
					var laction = lframe? lframe.getAction(action.getObject()): null;
					
					var equal_scale = laction &&
						(laction.getTransform().a==action.getTransform().a) &&
						(laction.getTransform().b==action.getTransform().b) &&
						(laction.getTransform().c==action.getTransform().c) &&
						(laction.getTransform().d==action.getTransform().d);
					var equal_translate = laction &&
						(laction.getTransform().x==action.getTransform().x) &&
						(laction.getTransform().y==action.getTransform().y);
					var equal_color = laction &&
						(laction.getColor().r==action.getColor().r) &&
						(laction.getColor().g==action.getColor().g) &&
						(laction.getColor().b==action.getColor().b) &&
						(laction.getColor().a==action.getColor().a);
					
					var flag_visible = (action.isVisible()? 0x01: 0x00);
					var flag_trigger = (action.getTrigger()!=null && action.getTrigger()!=''? 0x02: 0x00);
					var flag_source = (f==0 || (laction.getSource()!=action.getSource())? 0x04: 0x00);
					var flag_scale = (f==0 || !equal_scale? 0x08: 0x00);
					var flag_translate = (f==0 || !equal_translate? 0x10: 0x00);
					var flag_colorize = (f==0 || !equal_color? 0x20: 0x00);
					var flag_flipx = (action.isFlipX()? 0x40: 0x00);
					var flag_flipy = (action.isFlipY()? 0x80: 0x00);
					
					file.write16(anim.indexOfIncludedObject(action.getObject()));
					file.write8(flag_visible|flag_trigger|flag_source|flag_scale|flag_translate|flag_colorize|flag_flipx|flag_flipy);
					if(flag_trigger){
						file.write8(action.getTrigger().length);
						file.writeString(action.getTrigger());
					}
					if(flag_source){
						file.write16(action.getSource().getMeta("_index"));
					}
					if(flag_scale){
						file.writeFloat32(action.getTransform().a);
						file.writeFloat32(action.getTransform().b);
						file.writeFloat32(action.getTransform().c);
						file.writeFloat32(action.getTransform().d);
					}
					if(flag_translate){
						file.writeFloat32(action.getTransform().x);
						file.writeFloat32(action.getTransform().y);
					}
					if(flag_colorize){
						file.write8(action.getColor().r*255);
						file.write8(action.getColor().g*255);
						file.write8(action.getColor().b*255);
						file.write8(action.getColor().a*255);
					}
				}
			}
		}
		*/
	}
	
	self.importOld = function(proj, file){
		function decodePAF(){
			var annotation = {};
			
			// Decode summary
			_decode_summary(annotation);
			
			// Decode Image References
			_decode_images(annotation);
			
			// Decode Sources References
			_decode_srcs(annotation);
			
			// Decode Objects
			_decode_objects(annotation);
			
			// Decode Animations
			_decode_animations(annotation);
		}

		function _decode_string(limit){
			var name = "";
			for (var c=0; c<limit; c++){
				var chr = file.getc();
				if(chr!=''){
					name += chr;
				}
			}
			return name;
		}

		function _decode_summary(annotation){
			if(_decode_string(4)!="MPAF"){
				throw new Error("Invalid File Type!");
			}
			annotation["properties"] = {
				"file_format": file.read32(),
				"version": file.read32()
			};
			annotation["seeks"] = {
				"images": file.read32(),
				"sources": file.read32(),
				"objects": file.read32(),
				"animations": file.read32()
			};
		}

		function _decode_images(annotation){
			file.seekSet(annotation["seeks"]["images"]);
			var images = [];
			var total = file.read8();
			annotation["total_images"] = total;
			while (total > 0){
				var name = _decode_string(64);
				proj.createImage(name);
				total -= 1;
			}
		}

		function _decode_srcs(annotation){
			file.seekSet(annotation["seeks"]["sources"]);
			var sources = [];
			var total = file.read8();
			annotation["total_srcs"] = total;
			while (total > 0){
				proj.createSource(
					proj.getImage(file.read8()),
					new Rect(file.read16(), file.read16(), file.read16(), file.read16())
				);
				var resize = new Vector2(file.read16(), file.read16());
				total -= 1;
			}
		}

		function _decode_objects(annotation){
			file.seekSet(annotation["seeks"]["objects"]);
			var objects = [];
			var total = file.read8();
			annotation["total_objects"] = total;
			while (total > 0){
				var name = _decode_string(32);
				proj.createObject(
					proj.getSource(file.read8()),
					name
				);
				total -= 1;
			}
		}

		function _decode_animations(annotation){
			file.seekSet(annotation["seeks"]["animations"]);
			var animations = {};
			var total = file.read8();
			annotation["total_animations"] = total;
			while (total > 0){
				var name = _decode_string(16);
				var seek = file.read32();
				var anim = proj.createAnimation(name);
				_decode_animation(anim, annotation, seek);
				total -= 1;
			}
			return animations;
		}

		function _decode_animation(anim, annotation, seek){
			var _seek = file.tell();
			file.seekSet(seek);
			var frames_count = file.read16();
			var objs = [];
			
			for(var f=0; f<frames_count; f++){
				var frame = anim.addFrame();
				{
					var items = file.read8();
					var flags = 0;
					while (items > 0){
						var obj = proj.getObject(file.read8());
						if(!objs.includes(obj)){
							objs.push(obj);
						}
						var action = frame.createAction(obj);
						flags = file.read8();
						action.setVisible((flags&1)==1);
						action.setTrigger((flags&2)==2 ? 't': null);
						action.setSource(obj.getSource());
						action.getTransform().set(
							file.readFloat32(), file.readFloat32(),
							file.readFloat32(), file.readFloat32(),
							file.readFloat32(), file.readFloat32()
						);
						action.getColor().set(
							file.read8()/255, file.read8()/255, file.read8()/255, file.read8()/255
						);
						action.setFlipX(false);
						action.setFlipY(false);
						items -= 1;
					}
				}
				length -= 1;
			}
			
			var fframe = anim.getFrame(0);
			for(var i=0; i<objs.length; i++){
				var action = fframe.getAction(objs[i]);
				if(action==null){
					action = fframe.createAction(objs[i]);
					action.setVisible(false);
				}
				anim.includeObject(objs[i]);
			}
			file.seekSet(_seek);
		}
		decodePAF();
	}
	
});
