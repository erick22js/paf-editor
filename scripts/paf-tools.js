
function pafOptimize(proj, options={}){
	// First, spread all objects with the same source in
	var same_source_groups = [];
	var objs = proj.getAllObjects();
	for(; objs.length>0;){
		var group = [objs[0]];
		var cmp_obj = objs[0];
		objs.splice(0, 1);
		
		for(var o=0; o<objs.length; o++){
			if(cmp_obj.getSource()==objs[o].getSource()){
				group.push(objs[o]);
				objs.splice(o, 1);
				o--;
			}
		}
		
		same_source_groups.push(group);
	}
	
	// For each group, optimize the objects utility
	for(var g=0; g<same_source_groups.length; g++){
		var group = same_source_groups[g];
		var source = same_source_groups[g][0].getSource();
		
		// Firstly, is needed to ensure how much is really needed to use on each animation
		// and stipulates a min quantity needed
		// With this information, the n firsts objects will be selected, and each one
		// replacing the place of the older
		var g_min = 0;
		var anims = proj.getAllAnimations();
		for(var a=0; a < anims.length; a++){
			var anim = anims[a];
			var frames = anim.getAllFrames();
			var inc = anim.getIncludedObjects();
			var a_min = 0;
			for(var f=0; f < frames.length; f++){
				// The rules are:
				// * Of course, the source must be the targeted in group
				// * The object must be visible
				var f_min = 0
				for(var i=0; i < inc.length; i++){
					var obj = inc[i];
					var action = frames[f].getAction(obj);
					
					if(action.isVisible() && action.getSource()==source){
						f_min++;
					}
				}
				if(f_min > a_min){
					a_min = f_min;
				}
			}
			if(a_min > g_min){
				g_min = a_min;
			}
		}
		
		// The minimum must be lesser than the ammount in group
		// otherwise, no any optimization can be made
		if(g_min < group.length){
			// Creating new objects for the job
			var main = [];
			for(var i=0; i<g_min; i++){
				main.push(proj.createObject(source, group[i].getName()));
			}
			
			var g_collect = [];
			for(var a=0; a < anims.length; a++){
				var anim = anims[a];
				var frames = anim.getAllFrames();
				var inc = anim.getIncludedObjects();
				var a_min = 0;
				var a_collect = [];
				
				for(var f=0; f < frames.length; f++){
					var f_min = 0
					var m_i = 0; // Index of current main object to be alocatted
					
					for(var m=0; m < main.length; m++){
						frames[f].createAction(main[m]).setVisible(false);
					}
					
					for(var i=0; i < inc.length; i++){
						var obj = inc[i];
						var o_action = frames[f].getAction(obj);
						
						if(o_action.isVisible() && o_action.getSource()==source){
							if(!a_collect.includes(obj)){
								a_collect.push(obj);
							}
							
							if(!main[m_i].hasMeta("_tmpobj")){
								main[m_i].setMeta("_tmpobj", obj);
							}
							var n_action = frames[f].getAction(main[m_i]);
							n_action.setVisible(true);
							n_action.getTransform().set(o_action.getTransform());
							n_action.getColor().set(o_action.getColor());
							m_i++;
							f_min++;
						}
					}
					if(f_min > a_min){
						a_min = f_min;
					}
				}
				
				for(var m=0; m<a_min; m++){
					anim.includeObject(main[m]);
					anim.moveIncludedObject(main[m], anim.indexOfIncludedObject(main[m].getMeta("_tmpobj")));
					main[m].deleteMeta("_tmpobj");
				}
				
				for(var c=0; c<a_collect.length; c++){
					if(!g_collect.includes(a_collect[c])){
						g_collect.push(a_collect[c]);
					}
				}
			}
			
			for(var c=0; c<g_collect.length; c++){
				proj.removeObject(g_collect[c]);
			}
		}
	}
}

function pafRemoveUnused(proj, options={}){
	// Verify the unused objects by seeking for not includeds
	var anims = proj.getAllAnimations();
	var objs = proj.getAllObjects();
	for(var o=0; o<objs.length; o++){
		var count = 0;
		for(var a=0; a<anims.length; a++){
			var acount = 0;
			if(anims[a].hasIncludedObject(objs[o])){
				// Iterate over each frame to guarantee visibility
				var frames = anims[a].getAllFrames();
				for(var f=0; f<frames.length; f++){
					if(frames[f].getAction(objs[o]).isVisible()){
						count++;
						acount++;
						break;
					}
				}
				if(acount==0){
					anims[a].removeObject(objs[o]);
				}
			}
			if(count){
				break;
			}
		}
		if(count==0){
			proj.removeObject(objs[o]);
		}
	}
	
	// Verify the unused sources
	var srcs = proj.getAllSources();
	objs = proj.getAllObjects();
	for(var s=0; s<srcs.length; s++){
		var count = 0;
		for(var o=0; o<objs.length; o++){
			if(objs[o].getSource()==srcs[s]){
				count++;
				break;
			}
		}
		if(count==0){
			proj.removeSource(srcs[s]);
		}
	}
	
	// Verify the unused images
	var imgs = proj.getAllImages();
	srcs = proj.getAllSources();
	for(var i=0; i<imgs.length; i++){
		var count = 0;
		for(var s=0; s<srcs.length; s++){
			if(srcs[s].getImage()==imgs[i]){
				count++;
				break;
			}
		}
		if(count==0){
			proj.removeImage(imgs[i]);
		}
	}
}

function pafPackImages(proj, option={}){
	// Retrieving all images information
	var imgs = proj.getAllImages();
	var needed_area = 0;
	for(var i=0; i<imgs.length; i++){
		needed_area += imgs[i].getBitmap().getWidth()*imgs[i].getBitmap().getHeight();
	}
	
	// Constructing box order and fitting every image
	var order = Math.ceil(Math.log2(Math.sqrt(needed_area))) - 0.5;
	fitretry: while(true){
		var dimension = ~~Math.pow(2, order); // Rounding up the size of image to the next upper 2 power
		order += 0.25;
		console.log(dimension);
		var bb = bbCreate(dimension, dimension);
		
		for(var i=0; i<imgs.length; i++){
			var thumb = imgs[i].getBitmap();
			bbAddBox(bb, thumb.getWidth()+2, thumb.getHeight()+2, imgs[i]);
		}
		
		if(!bbFitBoxes(bb)){
			// Fit test for not empty
			for(var b=0; b<bb.boxes.length; b++){
				var box = bb.boxes[b];
				var img = box.id;
				if(isNaN(box.x)||isNaN(box.y)||(box.x==null)||(box.y==null)||(typeof box.x === "undefined")||(typeof box.y === "undefined")){
					continue fitretry;
				}
			}
			var new_image = new BitmapImage();
			new_image.resize(dimension, dimension);
			for(var b=0; b<bb.boxes.length; b++){
				var box = bb.boxes[b];
				var img = box.id;
				new_image.drawImage(img.getBitmap(), box.x+1, box.y+1);
			}
			var n_img = proj.createImage("atlas", new_image);
			
			// Assigning all the boxes
			for(var b=0; b<bb.boxes.length; b++){
				var box = bb.boxes[b];
				var img = box.id;
				
				// Updating every source
				var srcs = proj.getAllSources();
				for(var s=0; s<srcs.length; s++){
					if(srcs[s].getImage()==img){
						srcs[s].getRect().x += box.x+1;
						srcs[s].getRect().y += box.y+1;
						srcs[s].setImage(n_img);
					}
				}
			}
			
			// Removing the old images
			var imgs = proj.getAllImages();
			for(var i=0; i<imgs.length; i++){
				if(imgs[i] != n_img){
					proj.removeImage(imgs[i]);
				}
			}
			break;
		}
	}
}

function pafUnpackImages(proj, options={}){
	var imgs = proj.getAllImages();
	var srcs = proj.getAllSources();
	var gen = [];
	for(var i=0; i<srcs.length; i++){
		var src = srcs[i];
		var found_equal = false;
		
		for(var g=0; g<gen.length; g++){
			if((gen[g][1]==src.getImage())&&(gen[g][2].x==src.getRect().x)&&(gen[g][2].y==src.getRect().y)&&(gen[g][2].w==src.getRect().w)&&(gen[g][2].h==src.getRect().h)){
				src.setImage(gen[g][0]);
				src.getRect().x = 0;
				src.getRect().y = 0;
				found_equal = true;
				break;
			}
		}
		
		if(!found_equal){
			var new_image = new BitmapImage();
			new_image.resize(src.getRect().w, src.getRect().h);
			new_image.drawImageSrc(src.getImage().getBitmap(), src.getRect().x, src.getRect().y, src.getRect().w, src.getRect().h, 0, 0, src.getRect().w, src.getRect().h);
			var n_img = proj.createImage(src.getImage().getName()+"_"+i, new_image);
			gen.push([n_img, src.getImage(), src.getRect()]);
			src.setImage(n_img);
			src.getRect().x = 0;
			src.getRect().y = 0;
		}
	}
	
	for(var i=0; i<imgs.length; i++){
		proj.removeImage(imgs[i]);
	}
}

function pafGlobalTransform(proj, tr_x, tr_y, sc_x, sc_y){
	var anims = proj.getAllAnimations();
	for(var a=0; a<anims.length; a++){
		var anim = anims[a];
		var frames = anim.getAllFrames();
		for(var f=0; f<frames.length; f++){
			var actions = frames[f].getAllActions();
			for(var c=0; c<actions.length; c++){
				var action = actions[c];
				action.getTransform().scale(sc_x, sc_y);
				action.getTransform().translate(tr_x, tr_y);
			}
		}
	}
}


