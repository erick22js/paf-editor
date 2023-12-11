
function PAFWorkspace(){
	var self = this;
	var _workspace = self;
	
	// PROJECT MANAGMENT Workspace
	
	var project = new PAFProject();
	
	_workspace.getProject = function(){
		return project;
	}
	
	_workspace.newProject = function(){
		selectResource(null);
		project = new PAFProject();
		_workspace.updateFace();
	}
	
	//
	//	CORE FUNCTIONS
	//
	
	function animationLoadAnimation(animation){
		if(ui_props.animation.ref!=animation){
			ui_props.animation.selected = [];
			ui_props.animation.frame = 0;
		}
		ui_props.animation.ref = animation;
		ui_props.animation.objects = animation.getIncludedObjects();
		{
			var incobjs = animation.getIncludedObjects();
			var frames = animation.getAllFrames();
			ui_props.animation.frames = [];
			for(var fi=0; fi<frames.length; fi++){
				var frame = frames[fi];
				ui_props.animation.frames.push(frame);
			}
		}
		{
			if(ui_props.animation.frame >= animation.getTotalFrames()){
				ui_props.animation.frame = animation.getTotalFrames()-1;
			}
			var actions = animationGetCurrentFrame().getAllActions();
			for(var a=0; a<actions.length; a++){
				actions[a].updateThumb();
			}
		}
		if(animationFirstDo()){
			animationDo();
		}
		//console.log("Refreshed animation!");
	}
	
	function animationSelectFrame(index){
		if(index < 0){
			index = 0;
		}
		if(index >= animationCurrent().getTotalFrames()){
			index = animationCurrent().getTotalFrames()-1;
		}
		
		ui_props.animation.frame = index;
		var actions = animationGetCurrentFrame().getAllActions();
		for(var a=0; a<actions.length; a++){
			actions[a].updateThumb();
		}
		if(animationFirstDo()){
			animationDo();
		}
		uiUpdateProperties();
		uiUpdateCurrentDisplayView();
	}
	
	function animationGetCurrentFrame(){
		return ui_props.animation.ref.getFrame(ui_props.animation.frame);
	}
	
	function animationSelectObject(object, mode=0){ // Mode: -2 = unselect, -1 = move to top, 0 = set to selection, 1 = add select, 2 = toggle select
		if(object==null){
			ui_props.animation.selected.length = 0;
		}
		else{
			if(mode==-2){
				if(ui_props.animation.selected.includes(object)){
					ui_props.animation.selected.splice(ui_props.animation.selected.indexOf(object), 1);
				}
			}
			else if(mode==-1){
				if(ui_props.animation.selected.includes(object)){
					ui_props.animation.selected.splice(ui_props.animation.selected.indexOf(object), 1);
					ui_props.animation.selected.unshift(object);
				}
				else{
					ui_props.animation.selected.unshift(object);
				}
			}
			else if(mode==1){
				if(!ui_props.animation.selected.includes(object)){
					ui_props.animation.selected.push(object);
				}
			}
			else if(mode==2){
				if(ui_props.animation.selected.includes(object)){
					ui_props.animation.selected.splice(ui_props.animation.selected.indexOf(object), 1);
				}
				else{
					ui_props.animation.selected.push(object);
				}
			}
			else{
				ui_props.animation.selected = [object];
			}
		}
		uiUpdateProperties();
		uiUpdateCurrentDisplayView();
	}
	
	function animationGetSelectedObject(){
		return ui_props.animation.selected;
	}
	
	function animationGetObjectAction(object){
		var frame = ui_props.animation.ref.getFrame(ui_props.animation.frame);
		var action = frame.getAction(object);
		if(action){
			return action;
		}
		throw new Error("The action must be early provided! Seems it is null, or not existent in current frame");
	}
	
	function animationCurrent(){
		return ui_props.animation.ref;
	}
	
	function _frameFirstDo(frame){
		return !frame.hasMeta("_history");
	}
	
	function _frameDo(frame){
		if(!frame.hasMeta("_history")){
			var history = {
				"actions": [],
				"index": 0
			};
			frame.setMeta("_history", history);
		}
		console.log("Operation: DO");
		var history = frame.getMeta("_history");
		var acts = [];
		var actions = frame.getAllActions();
		for(var i=0; i<actions.length; i++){
			acts.push({
				"object": actions[i].getObject(),
				"transform": actions[i].getTransform().clone(),
			});
		}
		history.actions[history.index] = acts;
		history.index++;
		history.actions.length = history.index;
		return false;
	}
	
	function _frameUndo(frame){
		var history = frame.getMeta("_history")||{"actions": [],"index": -1};
		if(history.index > 1){
			console.log("Operation: UNDO");
			history.index--;
			var acts = history.actions[history.index-1];
			var actions = frame.getAllActions();
			
			for(var i=0; i<actions.length; i++){
				actsloop: for(var c=0; c<acts.length; c++){
					if(actions[i].getObject()==acts[c].object){
						actions[i].getTransform().set(acts[c].transform);
						break actsloop;
					}
				}
			}
		}
		uiUpdateProperties();
	}
	
	function _frameRedo(frame){
		var history = frame.getMeta("_history")||{"actions": [],"index": -1};
		if(history.index < history.actions.length){
			console.log("Operation: REDO");
			history.index++;
			
			var acts = history.actions[history.index-1];
			var actions = frame.getAllActions();
			
			for(var i=0; i<actions.length; i++){
				actsloop: for(var c=0; c<acts.length; c++){
					if(actions[i].getObject()==acts[c].object){
						actions[i].getTransform().set(acts[c].transform);
						break actsloop;
					}
				}
			}
		}
		uiUpdateProperties();
	}
	
	function animationFirstDo(){
		return _frameFirstDo(animationGetCurrentFrame());
	}
	
	function animationDo(){
		_frameDo(animationGetCurrentFrame());
	}
	
	function animationUndo(){
		_frameUndo(animationGetCurrentFrame());
	}
	
	function animationRedo(){
		_frameRedo(animationGetCurrentFrame());
	}
	
	function animationReplicate(objs, start_frame, end_frame){
		var start = start_frame;
		var end = end_frame;
		var cframe = animationCurrent().getFrame(start);
		for(var fi=start+1; fi<=end; fi++){
			var frame = animationCurrent().getFrame(fi);
			for(var i=0; i<objs.length; i++){
				frame.pasteAction(cframe.getAction(objs[i]));
			}
			_frameDo(frame);
		}
	}
	
	function animationTween(objs, start_frame, end_frame, rotated, curve=1){
		function lerp(v1, v2, a){
			return v1 + (v2-v1)*a;
		}
		
		function clockwise(a, b){
			if(b > a){
				return (b-a) <= Math.PI;
			}
			else{
				return (a-b) > Math.PI;
			}
		}
		
		var start = start_frame;
		var end = end_frame;
		var cframe = animationCurrent().getFrame(start);
		var eframe = animationCurrent().getFrame(end);
		for(var fi=start+1; fi<end; fi++){
			var a = (fi-start)/(end-start);
			a = Math.pow(a, curve);
			var frame = animationCurrent().getFrame(fi);
			for(var i=0; i<objs.length; i++){
				var fact = cframe.getAction(objs[i]);
				var eact = eframe.getAction(objs[i]);
				var cact = frame.getAction(objs[i]);
				
				if(a<0.5){
					cact.setVisible(fact.isVisible());
					cact.setTrigger(fact.getTrigger());
					cact.setSource(fact.getSource());
					cact.setFlipX(fact.isFlipX());
					cact.setFlipY(fact.isFlipY());
				}
				else{
					cact.setVisible(eact.isVisible());
					cact.setTrigger(eact.getTrigger());
					cact.setSource(eact.getSource());
					cact.setFlipX(eact.isFlipX());
					cact.setFlipY(eact.isFlipY());
				}
				if(rotated){
					var frot = fact.getTransform().getRotationByX();
					var erot = eact.getTransform().getRotationByX();
					
					var freset = fact.getTransform().clone().rotate(frot);
					var ereset = eact.getTransform().clone().rotate(erot);
					
					//console.log((~~(fskx*1000))/1000);
					//console.log((~~(eskx*1000))/1000);
					
					if(clockwise(frot, erot)){
						if(erot<frot){
							frot -= Math.PI*2;
						}
					}
					else{
						if(erot>frot){
							erot -= Math.PI*2;
						}
					}
					cact.getTransform().set(fact.getTransform());
					cact.getTransform().rotate(frot);
					cact.getTransform().a = lerp(freset.a, ereset.a, a);
					cact.getTransform().b = lerp(freset.b, ereset.b, a);
					cact.getTransform().c = lerp(freset.c, ereset.c, a);
					cact.getTransform().d = lerp(freset.d, ereset.d, a);
					cact.getTransform().rotate(-lerp(frot, erot, a));
				}
				else{
					cact.getTransform().a = lerp(fact.getTransform().a, eact.getTransform().a, a);
					cact.getTransform().b = lerp(fact.getTransform().b, eact.getTransform().b, a);
					cact.getTransform().c = lerp(fact.getTransform().c, eact.getTransform().c, a);
					cact.getTransform().d = lerp(fact.getTransform().d, eact.getTransform().d, a);
				}
				cact.getTransform().x = lerp(fact.getTransform().x, eact.getTransform().x, a);
				cact.getTransform().y = lerp(fact.getTransform().y, eact.getTransform().y, a);
				cact.getColor().r = lerp(fact.getColor().r, eact.getColor().r, a);
				cact.getColor().g = lerp(fact.getColor().g, eact.getColor().g, a);
				cact.getColor().b = lerp(fact.getColor().b, eact.getColor().b, a);
				cact.getColor().a = lerp(fact.getColor().a, eact.getColor().a, a);
			}
			_frameDo(frame);
		}
	}
	
	//
	//	UI UPDATES
	//
	
	const ANM_DRAG = 0;
	const ANM_TRANSLATE = 1;
	const ANM_SCALE = 2;
	const ANM_SKEW = 3;
	const ANM_ROTATE = 4;
	const ANM_ORIGIN = 5;
	const ANM_SELECT = 6;
	
	const ANM_LOCK = 0;
	const ANM_X = 1;
	const ANM_Y = 2;
	const ANM_XY = 3;
	
	var ui_props = {
		"selected": null,
		"open_folders": {
			"image": true,
			"source": true,
			"object": true,
			"animation": true
		},
		"view": {
			"x": 0,
			"y": 0,
			"zoom": 1,
		},
		"clipboard": [],
		"animation": {
			"ref": null,
			"objects": [],
			"frames": [],
			"selected": [],
			"frame": 0,
			"mode": ANM_DRAG,
			"axys": ANM_XY
		},
		"timeline": {
			"x": 0,
			"y": 0,
			"zoom": 1,
			"time": 0,
			"layout": {
				"left_margin": 100,
				"bottom_margin": 30,
				"obj_height": 25,
				"frame_width": 30
			}
		},
		"selection": {
			"active": false,
			"x": 0,
			"y": 0,
			"w": 0,
			"h": 0,
		},
		"input": {
			"in": null,
			"view": [null, null, null],
			"cursors": [
				{"x": 0, "y": 0, "dx": 0, "dy": 0},
				{"x": 0, "y": 0, "dx": 0, "dy": 0},
				{"x": 0, "y": 0, "dx": 0, "dy": 0}
			],
			"position": {
				"x": 0, "y": 0
			},
			"hold": [false, false, false],
			"ltime": [0, 0, 0]
		}
	}
	
	function selectResource(res){
		if(ui_props.selected == res){
			ui_props.selected = null;
		}
		else{
			ui_props.selected = res;
		}
		uiUpdateProperties();
		uiUpdateResourcesList();
		uiUpdateCurrentDisplayView();
	}
	this.updateFace = function(){
		selectResource(null);
	}
	
	function getSelectedResource(){
		return ui_props.selected;
	}
	
	function isResourceSelected(res){
		return ui_props.selected==res;
	}
	
	function uiUpdateProperties(){
		var res = ui_props.selected;
		
		properties_image.hidden = true;
		properties_source.hidden = true;
		properties_object.hidden = true;
		properties_animation.hidden = true;
		
		if(res){
			switch(res.getType()){
				case "PAFImage":{
					properties_image.hidden = null;
					
					// Updating Properties
					prop_image_name.value = res.getName();
					prop_img_dimension.textContent = "Width: "+res.getBitmap().getWidth()+"px; Height: "+res.getBitmap().getHeight()+"px;";
					
					// Adding Events
					prop_image_name.onchange = function(){
						res.setName(prop_image_name.value);
						uiUpdateResourcesList();
					}
					prop_image_pick.onclick = function(){
						File.pickURI(function(uris){
							var bitmap = new BitmapImage(uris[0], function(){
								res.setBitmap(bitmap);
								uiUpdateResourcesList();
								uiUpdateCurrentDisplayView();
							});
						});
					}
					prop_image_save.onclick = function(){
						File.saveUri(res.getName()+".png", res.getThumb().toDataURI());
					}
				}
				break;
				case "PAFSource":{
					properties_source.hidden = null;
					
					// Updating Properties
					prop_source_image.src = res.getImage().getBitmap().toDataURI();
					prop_source_image.title = res.getImage().getName();
					prop_source_image.onclick = function(ev){
						var options = [];
						var images = project.getAllImages();
						for(var i=0; i<images.length; i++){
							options.push({
								"name": images[i].getName(),
								"icon": images[i].getBitmap().toDataURI(),
								"image": images[i],
								"click": function(opt){
									res.setImage(opt.image);
									res.updateThumb();
									uiUpdateResourcesList();
									uiUpdateProperties();
									uiUpdateCurrentDisplayView();
								}
							});
						}
						uiCreateDropdown(prop_source_image, options);
					}
					prop_source_x.value = res.getRect().x;
					prop_source_y.value = res.getRect().y;
					prop_source_w.value = res.getRect().w;
					prop_source_h.value = res.getRect().h;
					
					// Adding Events
					prop_source_x.onchange = function(){
						res.getRect().x = Number(prop_source_x.value)||0;
						res.updateThumb();
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
					prop_source_y.onchange = function(){
						res.getRect().y = Number(prop_source_y.value)||0;
						res.updateThumb();
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
					prop_source_w.onchange = function(){
						res.getRect().w = Number(prop_source_w.value)||0;
						res.updateThumb();
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
					prop_source_h.onchange = function(){
						res.getRect().h = Number(prop_source_h.value)||0;
						res.updateThumb();
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
					prop_source_reset.onclick = function(){
						res.getRect().x = 0;
						res.getRect().y = 0;
						res.getRect().w = res.getImage().getThumb().getWidth();
						res.getRect().h = res.getImage().getThumb().getHeight();
						res.updateThumb();
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
				}
				break;
				case "PAFObject":{
					properties_object.hidden = null;
					
					// Updating Properties
					prop_object_name.value = res.getName();
					prop_object_image.src = res.getSource().getThumb().toDataURI();
					prop_object_image.title = "# "+project.indexOfSource(res.getSource());
					prop_object_image.onclick = function(ev){
						var options = [];
						var sources = project.getAllSources();
						for(var i=0; i<sources.length; i++){
							options.push({
								"name": "# "+i,
								"icon": sources[i].getThumb().toDataURI(),
								"source": sources[i],
								"click": function(opt){
									res.setSource(opt.source);
									res.updateThumb();
									uiUpdateResourcesList();
									uiUpdateProperties();
									uiUpdateCurrentDisplayView();
								}
							});
						}
						uiCreateDropdown(prop_object_image, options);
					}
					prop_object_x.value = res.getOrigin().x;
					prop_object_y.value = res.getOrigin().y;
					
					// Adding Events
					prop_object_name.onchange = function(){
						res.setName(prop_object_name.value);
						uiUpdateResourcesList();
					}
					prop_object_x.onchange = function(){
						res.getOrigin().x = Number(prop_object_x.value)||0;
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
					prop_object_y.onchange = function(){
						res.getOrigin().y = Number(prop_object_y.value)||0;
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
					prop_object_btop.onclick = function(){
						res.getOrigin().x = 0;
						res.getOrigin().y = 0;
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
					prop_object_bcenter.onclick = function(){
						res.getOrigin().x = res.getThumb().getWidth()/2;
						res.getOrigin().y = res.getThumb().getHeight()/2;
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
					prop_object_bbottom.onclick = function(){
						res.getOrigin().x = res.getThumb().getWidth();
						res.getOrigin().y = res.getThumb().getHeight();
						uiUpdateResourcesList();
						uiUpdateCurrentDisplayView();
					}
				}
				break;
				case "PAFAnimation":{
					animationLoadAnimation(res);
					
					// Updating Properties
					var objects = animationGetSelectedObject();
					if(objects.length==1){
						properties_animation.hidden = null;
						var object = objects[0];
						var action = animationGetObjectAction(object);
						
						prop_animation_object.textContent = "Object: \"" + object.getName() + "\"";
						prop_animation_image.src = animationGetCurrentFrame().getAction(animationGetSelectedObject()[0]).getSource().getThumb().toDataURI();
						prop_animation_image.title = "# "+project.indexOfSource(animationGetCurrentFrame().getAction(animationGetSelectedObject()[0]).getSource());
						prop_animation_visible.checked = action.isVisible();
						prop_animation_trigger.value = action.getTrigger();
						prop_animation_position_x.value = action.getTransform().x;
						prop_animation_position_y.value = action.getTransform().y;
						prop_animation_scale_x.value = action.getTransform().a;
						prop_animation_scale_y.value = action.getTransform().d;
						prop_animation_skew_x.value = action.getTransform().c;
						prop_animation_skew_y.value = action.getTransform().b;
						prop_animation_rotation.value = radToDeg(-action.getTransform().getRotationByX());
						prop_animation_color.value = action.getColor().toCode();
						prop_animation_opacity.value = action.getColor().a;
						prop_animation_flipx.checked = action.isFlipX();
						prop_animation_flipy.checked = action.isFlipY();
						
						// Adding Events
						prop_animation_image.onclick = function(){
							var options = [];
							var sources = project.getAllSources();
							for(var i=0; i<sources.length; i++){
								options.push({
									"name": "# "+i,
									"icon": sources[i].getThumb().toDataURI(),
									"source": sources[i],
									"click": function(opt){
										var objs = animationGetSelectedObject();
										if(objs.length==1){
											animationGetCurrentFrame().getAction(objs[0]).setSource(opt.source);
											animationGetCurrentFrame().getAction(objs[0]).updateThumb();
											animationDo();
											
											uiUpdateResourcesList();
											uiUpdateProperties();
											uiUpdateCurrentDisplayView();
										}
									}
								});
							}
							uiCreateDropdown(prop_animation_image, options);
						}
						prop_animation_visible.onchange = function(){
							action.setVisible(prop_animation_visible.checked);
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_trigger.onchange = function(){
							action.setTrigger(prop_animation_trigger.value);
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_position_x.onchange = function(){
							action.getTransform().x = Number(prop_animation_position_x.value)||0;
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_position_y.onchange = function(){
							action.getTransform().y = Number(prop_animation_position_y.value)||0;
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_scale_x.onchange = function(){
							action.getTransform().a = Number(prop_animation_scale_x.value)||0;
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_scale_y.onchange = function(){
							action.getTransform().d = Number(prop_animation_scale_y.value)||0;
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_skew_x.onchange = function(){
							action.getTransform().c = Number(prop_animation_skew_x.value)||0;
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_skew_y.onchange = function(){
							action.getTransform().b = Number(prop_animation_skew_y.value)||0;
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_rotation.onchange = function(){
							var origin = object.getOrigin().clone();
							var o_space = origin.clone().transform(action.getTransform());
							
							action.getTransform().translate(-o_space.x, -o_space.y);
							action.getTransform().rotate(action.getTransform().getRotationByX());
							action.getTransform().rotate(degToRad(Number(prop_animation_rotation.value)||0));
							action.getTransform().translate(o_space.x, o_space.y);
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_color.onchange = function(){
							action.getColor().setCode(prop_animation_color.value);
							action.updateThumb();
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_opacity.onchange = function(){
							action.getColor().a = parseFloat(prop_animation_opacity.value);
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						}
						prop_animation_flipx.onchange = function(){
							action.setFlipX(prop_animation_flipx.checked);
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						};
						prop_animation_flipy.onchange = function(){
							action.setFlipY(prop_animation_flipy.checked);
							animationDo();
							
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
						};
					}
				}
				break;
			}
		}
	}
	
	function uiUpdateResourcesList(){
		editor_resources.removeAllChildren();
		
		function onlclickFolder(folder){
			ui_props.open_folders[folder.options.type] = !ui_props.open_folders[folder.options.type];
			uiUpdateResourcesList();
		}
		function onrclickFolder(folder){
			uiCreateDropdown(folder, [
				{
					"name": "Create Resource",
					"type": folder.options.type,
					"click": function(option){
						switch(folder.options.type){
							case "image":{
								var default_name = "image_";
								var index = 1;
								while(project.hasImageWithName(default_name+index)){
									index++;
								}
								var name = prompt("Insert a name for image:", default_name+index);
								if(name){
									selectResource(project.createImage(name));
								}
							}
							break;
							case "source":{
								if(project.getTotalImages() > 0){
									selectResource(project.createSource(project.getAllImages()[0]));
								}
								else{
									alert("Create at least one image!");
								}
							}
							break;
							case "object":{
								if(project.getTotalSources() > 0){
									var default_name = "object_";
									var index = 1;
									while(project.hasObjectWithName(default_name+index)){
										index++;
									}
									var name = prompt("Insert a name for object:", default_name+index)
									if(name){
										selectResource(project.createObject(project.getAllSources()[0], name));
									}
								}
								else{
									alert("Create at least one source!");
								}
							}
							break;
							case "animation":{
								var default_name = "animation_";
								var index = 1;
								while(project.hasAnimationWithName(default_name+index)){
									index++;
								}
								try{
									var name = prompt("Insert a name for animation:", default_name+index);
									if(name){
										var anim = project.createAnimation(name);
										anim.addFrame();
										selectResource(anim);
									}
								}
								catch(e){
									alert(e);
								}
							}
							break;
						}
					}
				}
			]);
		}
		function onlclickItem(item){
			selectResource(item.options.reference);
		}
		function onrclickItem(item){
			uiCreateDropdown(item, [
				{
					"name": "Delete",
					"type": item.options.type,
					"click": function(option){
						switch(item.options.type){
							case "image":{
								if(confirm("Do you want to remove the image '"+item.options.reference.getName()+"'?")){
									if(getSelectedResource()==item.options.reference){
										selectResource(null);
									}
									project.removeImage(item.options.reference);
									uiUpdateResourcesList();
								}
							}
							break;
							case "source":{
								if(confirm("Do you want to remove this source?")){
									if(getSelectedResource()==item.options.reference){
										selectResource(null);
									}
									project.removeSource(item.options.reference);
									uiUpdateResourcesList();
								}
							}
							break;
							case "object":{
								if(confirm("Do you want to remove the object '"+item.options.reference.getName()+"'?")){
									var obj = item.options.reference;
									if(getSelectedResource()==item.options.reference){
										selectResource(null);
									}
									project.removeObject(obj);
									uiUpdateResourcesList();
									uiUpdateProperties();
									uiUpdateCurrentDisplayView();
								}
							}
							break;
							case "animation":{
								if(confirm("Do you want to remove the animation '"+item.options.reference.getName()+"'?")){
									if(getSelectedResource()==item.options.reference){
										selectResource(null);
									}
									project.removeAnimation(item.options.reference);
									uiUpdateResourcesList();
								}
							}
							break;
						}
					}
				},
				{
					"name": "Duplicate",
					"type": item.options.type,
					"click": function(option){
						switch(item.options.type){
							case "image":{
								var default_name = "image_";
								var index = 1;
								while(project.hasImageWithName(default_name+index)){
									index++;
								}
								var name = prompt("Insert a name for image:", default_name+index);
								if(name){
									default_name = name;
								}
								else{
									default_name += index;
								}
								project.duplicateImage(item.options.reference, default_name);
							}
							break;
							case "source":{
								project.duplicateSource(item.options.reference);
							}
							break;
							case "object":{
								var default_name = "object_";
								var index = 1;
								while(project.hasObjectWithName(default_name+index)){
									index++;
								}
								var name = prompt("Insert a name for object:", default_name+index)
								if(name){
									default_name = name;
								}
								else{
									default_name += index;
								}
								project.duplicateObject(item.options.reference, default_name);
							}
							break;
							case "animation":{
								var default_name = "animation_";
								var index = 1;
								while(project.hasAnimationWithName(default_name+index)){
									index++;
								}
								try{
									var name = prompt("Insert a name for animation:", default_name+index);
									if(name){
										default_name = name;
									}
									else{
										default_name += index;
									}
									project.duplicateAnimation(item.options.reference, default_name);
								}
								catch(e){
									alert(e);
								}
							}
							break;
						}
						uiUpdateResourcesList();
					}
				},
				{
					"name": "Move Up",
					"type": item.options.type,
					"click": function(option){
						var ammount = Number(prompt("Inform the ammount you want to MOVE UP: (Values below zero to set at begin)", 1))||0;
						switch(item.options.type){
							case "image":{
								var index = (ammount<0? -1: project.indexOfImage(item.options.reference))-ammount;
								project.moveImage(item.options.reference, index);
							}
							break;
							case "source":{
								var index = (ammount<0? -1: project.indexOfSource(item.options.reference))-ammount;
								project.moveSource(item.options.reference, index);
							}
							break;
							case "object":{
								var index = (ammount<0? -1: project.indexOfObject(item.options.reference))-ammount;
								project.moveObject(item.options.reference, index);
							}
							break;
							case "animation":{
								var index = (ammount<0? -1: project.indexOfAnimation(item.options.reference))-ammount;
								project.moveAnimation(item.options.reference, index);
							}
							break;
						}
						uiUpdateResourcesList();
						uiUpdateProperties();
						uiUpdateCurrentDisplayView();
					}
				},
				{
					"name": "Move Down",
					"type": item.options.type,
					"click": function(option){
						var ammount = Number(prompt("Inform the ammount you want to MOVE DOWN: (Values below zero to set at end)", 1))||0;
						switch(item.options.type){
							case "image":{
								var index = (ammount<0? project.getTotalImages()-1: project.indexOfImage(item.options.reference))+ammount;
								project.moveImage(item.options.reference, index);
							}
							break;
							case "source":{
								var index = (ammount<0? project.getTotalSources()-1: project.indexOfSource(item.options.reference))+ammount;
								project.moveSource(item.options.reference, index);
							}
							break;
							case "object":{
								var index = (ammount<0? project.getTotalObjects()-1: project.indexOfObject(item.options.reference))+ammount;
								project.moveObject(item.options.reference, index);
							}
							break;
							case "animation":{
								var index = (ammount<0? project.getTotalAnimations()-1: project.indexOfAnimation(item.options.reference))+ammount;
								project.moveAnimation(item.options.reference, index);
							}
							break;
						}
						uiUpdateResourcesList();
						uiUpdateProperties();
						uiUpdateCurrentDisplayView();
					}
				}
			]);
		}
		
		// Add Images Resources
		{
			var folder = uiCreateResourceItemElement({
				"name": "Images ("+project.getTotalImages()+")",
				"mode": "folder",
				"type": "image",
				"open": ui_props.open_folders.image,
				"onlclick": onlclickFolder,
				"onrclick": onrclickFolder
			});
			editor_resources.appendChild(folder);
			
			if(ui_props.open_folders.image){
				var images = project.getAllImages();
				for(var i=0; i<images.length; i++){
					var item = uiCreateResourceItemElement({
						"name": images[i].getName(),
						"mode": "file",
						"type": "image",
						"icon": images[i].getBitmap().toDataURI(),
						"reference": images[i],
						"selected": isResourceSelected(images[i]),
						"onlclick": onlclickItem,
						"onrclick": onrclickItem
					});
					editor_resources.appendChild(item);
				}
			}
		}
		
		// Add Sources Resources
		{
			var folder = uiCreateResourceItemElement({
				"name": "Sources ("+project.getTotalSources()+")",
				"mode": "folder",
				"type": "source",
				"open": ui_props.open_folders.source,
				"onlclick": onlclickFolder,
				"onrclick": onrclickFolder
			});
			editor_resources.appendChild(folder);
			
			if(ui_props.open_folders.source){
				var sources = project.getAllSources();
				for(var i=0; i<sources.length; i++){
					var item = uiCreateResourceItemElement({
						"name": "# "+i,
						"mode": "file",
						"type": "source",
						"icon": sources[i].getThumb().toDataURI(),
						"reference": sources[i],
						"selected": isResourceSelected(sources[i]),
						"onlclick": onlclickItem,
						"onrclick": onrclickItem
					});
					editor_resources.appendChild(item);
				}
			}
		}
		
		// Add Objects Resources
		{
			var folder = uiCreateResourceItemElement({
				"name": "Objects ("+project.getTotalObjects()+")",
				"mode": "folder",
				"type": "object",
				"open": ui_props.open_folders.object,
				"onlclick": onlclickFolder,
				"onrclick": onrclickFolder
			});
			editor_resources.appendChild(folder);
			
			if(ui_props.open_folders.object){
				var objects = project.getAllObjects();
				for(var i=0; i<objects.length; i++){
					var item = uiCreateResourceItemElement({
						"name": objects[i].getName(),
						"mode": "file",
						"type": "object",
						"icon": objects[i].getThumb().toDataURI(),
						"reference": objects[i],
						"selected": isResourceSelected(objects[i]),
						"onlclick": onlclickItem,
						"onrclick": onrclickItem
					});
					editor_resources.appendChild(item);
				}
			}
		}
		
		// Add Animations Resources
		{
			var folder = uiCreateResourceItemElement({
				"name": "Animations ("+project.getTotalAnimations()+")",
				"mode": "folder",
				"type": "animation",
				"open": ui_props.open_folders.animation,
				"onlclick": onlclickFolder,
				"onrclick": onrclickFolder
			});
			editor_resources.appendChild(folder);
			
			if(ui_props.open_folders.animation){
				var animations = project.getAllAnimations();
				for(var i=0; i<animations.length; i++){
					var item = uiCreateResourceItemElement({
						"name": animations[i].getName(),
						"mode": "file",
						"type": "animation",
						"reference": animations[i],
						"selected": isResourceSelected(animations[i]),
						"onlclick": onlclickItem,
						"onrclick": onrclickItem
					});
					editor_resources.appendChild(item);
				}
			}
		}
		
		for(var i=0; i<50; i++){
			var space = document.createElement("br");
			editor_resources.appendChild(space);
		}
	}
	_workspace.uiUpdateResourcesList = uiUpdateResourcesList;
	
	var bmprd = new BitmapImage().hookCanvas(display_regular); // Regular Display
	var bmpad = new BitmapImage().hookCanvas(animation_view); // Animation Display
	var bmptd = new BitmapImage().hookCanvas(animation_timeline); // Timeline Display
	function uiUpdateCurrentDisplayView(){
		var res = getSelectedResource();
		
		// Hide all views for default
		display_regular.hidden = true;
		display_animation.hidden = true;
		_uiAppendViewEvents(display_regular, {});
		_uiAppendViewEvents(animation_view, {});
		_uiAppendViewEvents(animation_timeline, {});
		
		if(res){
			switch(res.getType()){
				case "PAFImage":{
					display_regular.hidden = null;
					display_regular.width = display_regular.getBoundingClientRect().width;
					display_regular.height = display_regular.getBoundingClientRect().height;
					_uiUpdateImageDisplay(bmprd);
					_uiAppendViewEvents(display_regular, {
						"onmousewheel": function(d){
							if(d > 0){
								ui_props.view.zoom *= 0.85;
							}
							else if(d < 0){
								ui_props.view.zoom *= 1.1764;
							}
							_uiUpdateImageDisplay(bmprd);
						},
						"onmousedrag": function(btn, x, y){
							ui_props.view.x += x/ui_props.view.zoom;
							ui_props.view.y += y/ui_props.view.zoom;
							_uiUpdateImageDisplay(bmprd);
						}
					});
				}
				break;
				case "PAFSource":{
					display_regular.hidden = null;
					display_regular.width = display_regular.getBoundingClientRect().width;
					display_regular.height = display_regular.getBoundingClientRect().height;
					_uiUpdateSourceDisplay(bmprd);
					
					var dragging = 0;
					var drag_acux = 0;
					var drag_acuy = 0;
					
					var options = {
						"onmousewheel": function(d){
							if(d > 0){
								ui_props.view.zoom *= 0.85;
							}
							else if(d < 0){
								ui_props.view.zoom *= 1.1764;
							}
							_uiUpdateSourceDisplay(bmprd);
						},
						"onmousedrag": function(btn, x, y){
							var rect = res.getRect();
							
							x /= ui_props.view.zoom;
							y /= ui_props.view.zoom;
							drag_acux += x;
							drag_acuy += y;
							if(dragging){
								if(dragging==1){
									rect.x += ~~drag_acux;
									rect.y += ~~drag_acuy;
									rect.w -= ~~drag_acux;
									rect.h -= ~~drag_acuy;
								}
								else if(dragging==2){
									rect.y += ~~drag_acuy;
									rect.w += ~~drag_acux;
									rect.h -= ~~drag_acuy;
								}
								else if(dragging==3){
									rect.x += ~~drag_acux;
									rect.w -= ~~drag_acux;
									rect.h += ~~drag_acuy;
								}
								else if(dragging==4){
									rect.w += ~~drag_acux;
									rect.h += ~~drag_acuy;
								}
								else if(dragging==5){
									rect.x += ~~drag_acux;
									rect.y += ~~drag_acuy;
								}
								res.updateThumb();
							}
							else{
								ui_props.view.x += x;
								ui_props.view.y += y;
							}
							drag_acux %= 1;
							drag_acuy %= 1;
							
							_uiUpdateSourceDisplay(bmprd);
						},
						"onmousedown": function(btn, x, y){
							var mat = uiGetViewMatrix(bmprd);
							var t_space = (new Vector2(x, y)).untransform(mat);
							var rect = res.getRect();
							
							drag_acux = 0;
							drag_acuy = 0;
							if(btn==0){
								if(t_space.distanceTo(rect.x, rect.y) <= 12/ui_props.view.zoom){
									dragging = 1;
								}
								else if(t_space.distanceTo(rect.x+rect.w, rect.y) <= 12/ui_props.view.zoom){
									dragging = 2;
								}
								else if(t_space.distanceTo(rect.x, rect.y+rect.h) <= 12/ui_props.view.zoom){
									dragging = 3;
								}
								else if(t_space.distanceTo(rect.x+rect.w, rect.y+rect.h) <= 12/ui_props.view.zoom){
									dragging = 4;
								}
								else if(rect.isPointInside(t_space)){
									dragging = 5;
								}
							}
							_uiUpdateSourceDisplay(bmprd);
						},
						"onmouseup": function(){
							if(dragging){
								dragging = 0;
								uiUpdateResourcesList();
								uiUpdateProperties();
								uiUpdateCurrentDisplayView();
							}
							_uiUpdateSourceDisplay(bmprd);
						}
					};
					_uiAppendViewEvents(display_regular, options);
				}
				break;
				case "PAFObject":{
					display_regular.hidden = null;
					display_regular.width = display_regular.getBoundingClientRect().width;
					display_regular.height = display_regular.getBoundingClientRect().height;
					_uiUpdateObjectDisplay(bmprd);
					
					var dragging = 0;
					
					_uiAppendViewEvents(display_regular, {
						"onmousewheel": function(d){
							if(d > 0){
								ui_props.view.zoom *= 0.85;
							}
							else if(d < 0){
								ui_props.view.zoom *= 1.1764;
							}
							_uiUpdateObjectDisplay(bmprd);
						},
						"onmousedrag": function(btn, x, y){
							var x = x/ui_props.view.zoom;
							var y = y/ui_props.view.zoom;
							var origin = res.getOrigin();
							
							if(dragging){
								origin.x += x;
								origin.y += y;
							}
							else{
								ui_props.view.x += x;
								ui_props.view.y += y;
							}
							_uiUpdateObjectDisplay(bmprd);
						},
						"onmousedown": function(btn, x, y){
							var mat = uiGetViewMatrix(bmprd);
							var t_space = (new Vector2(x, y)).untransform(mat);
							var origin = res.getOrigin();
							
							if(btn==0){
								if(t_space.distanceTo(origin.x, origin.y) <= 12/ui_props.view.zoom){
									dragging = 1;
								}
							}
							_uiUpdateObjectDisplay(bmprd);
						},
						"onmouseup": function(){
							if(dragging){
								dragging = 0;
								uiUpdateProperties();
								uiUpdateCurrentDisplayView();
							}
							_uiUpdateObjectDisplay(bmprd);
						}
					});
				}
				break;
				case "PAFAnimation":{
					display_animation.hidden = null;
					animation_view.width = animation_view.getBoundingClientRect().width;
					animation_view.height = animation_view.getBoundingClientRect().height;
					animation_timeline.width = animation_timeline.getBoundingClientRect().width;
					animation_timeline.height = animation_timeline.getBoundingClientRect().height;
					_uiUpdateAnimationDisplay(bmpad, bmptd);
					
					var dragging = 0;
					
					var acu = new Vector2(0, 0);
					var pos_bmouse = new Vector2(0, 0);
					
					var transforming = 0;
					
					_uiAppendViewEvents(animation_view, {
						"onmousewheel": function(d){
							if(d > 0){
								ui_props.view.zoom *= 0.85;
							}
							else if(d < 0){
								ui_props.view.zoom *= 1.1764;
							}
							_uiUpdateAnimationDisplay(bmpad, bmptd);
						},
						"onmousedrag": function(btn, cx, cy, ax, ay, ev){
							var x = cx/ui_props.view.zoom;
							var y = cy/ui_props.view.zoom;
							
							if(btn==2){
								ui_props.view.x += x;
								ui_props.view.y += y;
							}
							else{
								if(dragging){
									
								}
								else{
									var objs = animationGetSelectedObject();
									var origin = new Vector2();
									var o_space = new Vector2();
									var grid = ui_props.animation.grid;
									
									if(objs.length){
										origin = objs[0].getOrigin().clone();
										o_space = origin.clone().transform(animationGetObjectAction(objs[0]).getTransform())
									}
									
									if(transforming!=ui_props.animation.mode){
										if(ui_props.animation.mode==ANM_SELECT){
											ui_props.selection.active = true;
											var mat = uiGetViewMatrix(bmpad);
											var apos = (new Vector2(ax, ay)).untransform(mat);
											ui_props.selection.x = apos.x;
											ui_props.selection.y = apos.y;
											ui_props.selection.w = 0;
											ui_props.selection.h = 0;
										}
										if(transforming){
											if(ui_props.animation.mode!=ANM_SELECT){
												animationDo();
											}
										}
									}
									transforming = ui_props.animation.mode;
									
									switch(ui_props.animation.mode){
										case ANM_DRAG:{
											ui_props.view.x += x;
											ui_props.view.y += y;
										}
										break;
										case ANM_SELECT:{
											ui_props.selection.w += x;
											ui_props.selection.h += y;
										}
										break;
										case ANM_TRANSLATE:{
											for(var i=0; i<objs.length; i++){
												var action = animationGetObjectAction(objs[i]);
												
												action.getTransform().translate(origin.x, origin.y);
												if(ui_props.animation.axys&ANM_X){
													if (project.grid){
														acu.x += x + action.getTransform().x;
														var i_x = (~~(acu.x/project.grid)) * project.grid;
														action.getTransform().x = i_x;
														acu.x %= project.grid;
													}
													else {
														action.getTransform().x += x;
														acu.x = 0;
													}
												}
												if(ui_props.animation.axys&ANM_Y){
													if (project.grid){
														acu.y += y + action.getTransform().y;
														var i_y = (~~(acu.y/project.grid)) * project.grid;
														action.getTransform().y = i_y;
														acu.y %= project.grid;
													}
													else {
														action.getTransform().y += y;
														acu.y = 0;
													}
												}
												action.getTransform().translate(-origin.x, -origin.y);
											}
										}
										break;
										case ANM_SCALE:{
											for(var i=0; i<objs.length; i++){
												var obj = objs[i];
												var action = animationGetObjectAction(obj);
												var mat = uiGetViewMatrix(bmpad);
												var l_space = (new Vector2(ax-cx, ay-cy)).untransform(mat);
												var c_space = (new Vector2(ax, ay)).untransform(mat);
												var l_dif = o_space.clone().sub(l_space);
												var c_dif = o_space.clone().sub(c_space);
												
												action.getTransform().translate(-o_space.x, -o_space.y);
												if(ui_props.animation.axys&ANM_X && ui_props.animation.axys&ANM_Y && ev.shiftKey){
													action.getTransform().scale(
														c_dif.y/l_dif.y,
														c_dif.y/l_dif.y);
												}
												else{
													action.getTransform().scale(
														ui_props.animation.axys&ANM_X? c_dif.x/l_dif.x: 1,
														ui_props.animation.axys&ANM_Y? c_dif.y/l_dif.y: 1);
												}
												action.getTransform().translate(o_space.x, o_space.y);
											}
										}
										break;
										case ANM_SKEW:{
											for(var i=0; i<objs.length; i++){
												var obj = objs[i];
												var action = animationGetObjectAction(obj);
												var mat = uiGetViewMatrix(bmpad);
												//var o_space = origin.transform(action.getTransform());
												var l_space = (new Vector2(ax-cx, ay-cy)).untransform(mat);
												var c_space = (new Vector2(ax, ay)).untransform(mat);
												var l_dif = o_space.clone().sub(l_space);
												var c_dif = o_space.clone().sub(c_space);
												
												action.getTransform().translate(-o_space.x, -o_space.y);
												var ls = action.getTransform().getScale();
												{
													/*
													var skew_x = (c_dif.x-l_dif.x)/(l_dif.y);
													var skew_y = (c_dif.y-l_dif.y)/(l_dif.x);
													action.getTransform().mul((new Matrix3x2()).setSkew(
														ui_props.animation.axys&ANM_X? skew_x:0,
														ui_props.animation.axys&ANM_Y? skew_y:0
													));
													*/
													var skew_x = x/48;
													var skew_y = y/48;
													action.getTransform().c += ui_props.animation.axys&ANM_X? skew_x: 0;
													action.getTransform().b += ui_props.animation.axys&ANM_Y? skew_y: 0;
												}
												var cs = action.getTransform().getScale();
												action.getTransform().scale(ls.div(cs));
												action.getTransform().translate(o_space.x, o_space.y);
											}
										}
										break;
										case ANM_ROTATE:{
											for(var i=0; i<objs.length; i++){
												var obj = objs[i];
												var action = animationGetObjectAction(obj);
												var mat = uiGetViewMatrix(bmpad);
												var l_space = (new Vector2(ax-cx, ay-cy)).untransform(mat);
												var c_space = (new Vector2(ax, ay)).untransform(mat);
												var l_ang = o_space.angleTo(l_space);
												var c_ang = o_space.angleTo(c_space);
												
												action.getTransform().translate(-o_space.x, -o_space.y);
												action.getTransform().rotate(l_ang-c_ang);
												action.getTransform().translate(o_space.x, o_space.y);
											}
										}
										break;
										case ANM_ORIGIN:{
											if(objs[0]){
												var obj = objs[0];
												var action = animationGetObjectAction(obj);
												var mat = uiGetViewMatrix(bmpad);
												var l_space = ((new Vector2(
													ui_props.animation.axys&ANM_X? ax-cx: ax, 
													ui_props.animation.axys&ANM_Y? ay-cy: ay)).untransform(mat)).untransform(action.getTransform());
												var c_space = ((new Vector2(ax, ay)).untransform(mat)).untransform(action.getTransform());
												var d_space = c_space.sub(l_space);
												obj.getOrigin().add(d_space);
											}
										}
										break;
									}
								}
							}
						
							_uiUpdateAnimationDisplay(bmpad, bmptd);
						},
						"onmousedown": function(btn, x, y){
							var mat = uiGetViewMatrix(bmprd);
							var t_space = (new Vector2(x, y)).untransform(mat);
							
							if(btn != 2){
								acu = new Vector2(0, 0);
								var pos_bmouse = new Vector2(x, y);
							}
							
							_uiUpdateAnimationDisplay(bmpad, bmptd);
						},
						"onmouseup": function(btn, x, y, ev){
							if(dragging){
								dragging = 0;
							}
							if(transforming){
								if(transforming!=ANM_SELECT){
									animationDo();
								}
								else{
									var inc = animationCurrent().getIncludedObjects();
									var sel = ui_props.selection;
									
									if(sel.w < 0){
										sel.x += sel.w;
										sel.w *= -1;
									}
									if(sel.h < 0){
										sel.y += sel.h;
										sel.h *= -1;
									}
									
									if(!ev.shiftKey && !ev.altKey && !ev.ctrlKey){
										animationSelectObject(null);
									}
									
									for(var a=0; a<inc.length; a++){
										var act = animationGetCurrentFrame().getAction(inc[a]);
										var att = act.getTransform();
										
										// Check if any point is within selection
										var o0 = (new Vector2(0, 0)).transform(att);
										var o1 = (new Vector2(act.getSource().getThumb().getWidth(), 0)).transform(att);
										var o2 = (new Vector2(act.getSource().getThumb().getWidth(), act.getSource().getThumb().getHeight())).transform(att);
										var o3 = (new Vector2(0, act.getSource().getThumb().getHeight())).transform(att);
										
										// Check if selection point is with source
										var s0 = (new Vector2(sel.x, sel.y)).untransform(att);
										var s1 = (new Vector2(sel.x+sel.w, sel.y)).untransform(att);
										var s2 = (new Vector2(sel.x+sel.w, sel.y+sel.h)).untransform(att);
										var s3 = (new Vector2(sel.x, sel.y+sel.h)).untransform(att);
										
										if(((o0.x>=sel.x && o0.x<sel.x+sel.w) && (o0.y>=sel.y && o0.y<sel.y+sel.h))
											||((o1.x>=sel.x && o1.x<sel.x+sel.w) && (o1.y>=sel.y && o1.y<sel.y+sel.h))
											||((o2.x>=sel.x && o2.x<sel.x+sel.w) && (o2.y>=sel.y && o2.y<sel.y+sel.h))
											||((o3.x>=sel.x && o3.x<sel.x+sel.w) && (o3.y>=sel.y && o3.y<sel.y+sel.h))
											||((s0.x>=0 && s0.x<act.getSource().getThumb().getWidth()) && (s0.y>=0 && s0.y<act.getSource().getThumb().getHeight()))
											||((s1.x>=0 && s1.x<act.getSource().getThumb().getWidth()) && (s1.y>=0 && s1.y<act.getSource().getThumb().getHeight()))
											||((s2.x>=0 && s2.x<act.getSource().getThumb().getWidth()) && (s2.y>=0 && s2.y<act.getSource().getThumb().getHeight()))
											||((s3.x>=0 && s3.x<act.getSource().getThumb().getWidth()) && (s3.y>=0 && s3.y<act.getSource().getThumb().getHeight()))
											){
											animationSelectObject(act.getObject(), ev.shiftKey?1:ev.altKey?-1:ev.ctrlKey?2:1);
										}
									}
									ui_props.selection.active = false;
								}
								transforming = 0;
							}
							uiUpdateProperties();
							uiUpdateCurrentDisplayView();
							_uiUpdateAnimationDisplay(bmpad, bmptd);
						},
						"onmousetap": function(btn, x, y, ev){
							if(btn==0){
								var frame = animationGetCurrentFrame();
								var inc = animationCurrent().getIncludedObjects();
								//console.log(actions);
								for(var i=inc.length-1; i>=0; i--){
									var action = frame.getAction(inc[i]);
									var object = action.getObject();
									var transform = action.getTransform();
									var rect = object.getSource().getRect();
									var unvec = (new Vector2(x, y)).untransform(uiGetViewMatrix(bmpad));
									//console.log(unvec.toString());
									//console.log(rect);
									unvec.untransform(transform);
									if(((unvec.x>=0) && (unvec.x<rect.w)) && ((unvec.y>=0) && (unvec.y<rect.h)) && !object.getMeta("_locked")){
									//if(((new Rect()).setSize(rect.x, rect.y)).isPointInside(unvec)){
										animationSelectObject(object, ev.shiftKey?1:ev.altKey?-1:ev.ctrlKey?2:0);
										break;
									}
								}
							}
							else if(btn==2){
								uiCreateDropdown({"x":ev.clientX, "y":ev.clientY, "width":0}, [
									{
										"name": "Hide/Show",
										"click": function(opt){
											var objs = animationGetSelectedObject();
											for(var i=objs.length-1; i>=0; i--){
												objs[i].setMeta("_invisible", !objs[0].getMeta("_invisible"));
											}
											uiUpdateProperties();
											uiUpdateCurrentDisplayView();
										}
									},
									{
										"name": "Unlock/Lock",
										"click": function(opt){
											var objs = animationGetSelectedObject();
											for(var i=objs.length-1; i>=0; i--){
												objs[i].setMeta("_locked", !objs[0].getMeta("_locked"));
											}
											uiUpdateProperties();
											uiUpdateCurrentDisplayView();
										}
									},
									{
										"name": "Replicate",
										"click": function(opt){
											var ammount = Number(prompt("Insert how many frames: (Lesser than zero fill the rest of animation)", 1))||0;
											animationReplicate(
												animationGetSelectedObject(),
												ui_props.animation.frame, ammount < 0? animationCurrent().getTotalFrames()-1: ui_props.animation.frame+ammount);
										}
									},
									{
										"name": "Tween",
										"click": function(opt){
											var ammount = Number(prompt("Insert how many frames: (Lesser than zero fill the rest of animation)", 1))||0;
											animationTween(
												animationGetSelectedObject(),
												ui_props.animation.frame, ammount < 0? animationCurrent().getTotalFrames()-1: ui_props.animation.frame+ammount,
												confirm("Tween with rotation?"));
										}
									},
									{
										"name": "Remove",
										"click": function(opt){
											var objs = animationGetSelectedObject();
											for(var i=objs.length-1; i>=0; i--){
												res.unincludeObject(objs[i]);
											}
											for(var i=objs.length-1; i>=0; i--){
												animationSelectObject(objs[i], 2);
											}
											uiUpdateProperties();
											uiUpdateCurrentDisplayView();
										}
									}
								]);
							}
						}
					});
					
					_uiAppendViewEvents(animation_timeline, {
						"onmousewheel": function(d, ev){
							if(ev.shiftKey){
								ui_props.timeline.y -= d;
							}
							else if(ev.altKey){
								if(d > 0){
									ui_props.timeline.zoom *= 0.85;
								}
								else if(d < 0){
									ui_props.timeline.zoom *= 1.1764;
								}
							}
							else{
								ui_props.timeline.x += d;
							}
							_uiUpdateAnimationDisplay(bmpad, bmptd);
						},
						"onmousedrag": function(btn, x, y){
							var x = x/ui_props.timeline.zoom;
							var y = y;
							
							if(dragging){
								
							}
							else{
								ui_props.timeline.x -= x/25;
								ui_props.timeline.y += y/25;
							}
							_uiUpdateAnimationDisplay(bmpad, bmptd);
						},
						"onmousedown": function(btn, x, y){
							var mat = uiGetViewMatrix(bmprd);
							var t_space = (new Vector2(x, y)).untransform(mat);
							
							_uiUpdateAnimationDisplay(bmpad, bmptd);
						},
						"onmouseup": function(){
							if(dragging){
								dragging = 0;
								uiUpdateProperties();
								uiUpdateCurrentDisplayView();
							}
							_uiUpdateAnimationDisplay(bmpad, bmptd);
						},
						"onmousetap": function(btn, x, y, ev){
							var el = uiGetTimelineElement(x, y);
							if(btn==0){
								//
								//	ADD OBJECT TO TIMELINE
								//
								if(el.type==TME_ADDOBJ){
									var objs = res.getNotIncludedObjects();
									if(objs.length){
										var options = [];
										for(var i=0; i<objs.length; i++){
											options.push({
												"name": objs[i].getName(),
												"icon": objs[i].getThumb().toDataURI(),
												"object": objs[i],
												"click": function(opt){
													res.includeObject(opt.object);
													animationDo();
													uiUpdateProperties();
													uiUpdateCurrentDisplayView();
												}
											});
										}
										uiCreateDropdown({"x":ev.clientX, "y":ev.clientY, "width":0}, options);
									}
								}
								//
								//	SELECT OBJECTS
								//
								if(el.type==TME_OBJ){
									animationSelectObject(el.object, ev.shiftKey?1:ev.altKey?-1:0);
								}
								//
								//	MANAGE FRAMES IN TIMELINE
								//
								if(el.type==TME_FRAME){
									animationSelectFrame(el.frame_index);
								}
								//
								//	MANAGES ACTION
								//
								if(el.type==TME_ACTION){
									animationSelectFrame(el.frame_index);
									animationSelectObject(el.object, ev.shiftKey?1:ev.altKey?-1:0);
								}
							}
							else if(btn==2){
								//
								//	MANAGE OBJECTS IN TIMELINE
								//
								if(el.type==TME_OBJ){
									uiCreateDropdown({"x":ev.clientX, "y":ev.clientY, "width":0}, [
										{
											"name": el.object.getMeta("_invisible")?"Show":"Hide",
											"click": function(opt){
												el.object.setMeta("_invisible", !el.object.getMeta("_invisible"));
												uiUpdateProperties();
												uiUpdateCurrentDisplayView();
											}
										},
										{
											"name": el.object.getMeta("_locked")?"Unlock":"Lock",
											"click": function(opt){
												el.object.setMeta("_locked", !el.object.getMeta("_locked"));
												uiUpdateProperties();
												uiUpdateCurrentDisplayView();
											}
										},
										{
											"name": "Remove",
											"click": function(opt){
												res.unincludeObject(el.object);
												uiUpdateProperties();
												uiUpdateCurrentDisplayView();
											}
										}
									]);
								}
								//
								//	MANAGE FRAMES IN TIMELINE
								//
								if(el.type==TME_FRAME || el.type==TME_BOTTOM){
									uiCreateDropdown({"x":ev.clientX, "y":ev.clientY, "width":0}, [
										{
											"name": "Insert Frame",
											"click": function(opt){
												var ammount = Number(prompt("Insert the ammount:", 1))||0;
												var ammount2 = ammount;
												while(ammount > 0){
													res.addFrame(ui_props.animation.frame);
													ammount--;
												}
												animationSelectFrame(ui_props.animation.frame+ammount2);
												uiUpdateProperties();
												uiUpdateCurrentDisplayView();
											}
										},
										{
											"name": "Append Frame",
											"click": function(opt){
												var ammount = Number(prompt("Insert the ammount:", 1))||0;
												var ammount2 = ammount;
												while(ammount > 0){
													res.addFrame();
													ammount--;
												}
												animationSelectFrame(ui_props.animation.frame+ammount2);
												uiUpdateProperties();
												uiUpdateCurrentDisplayView();
											}
										},
										{
											"name": "Duplicate",
											"click": function(opt){
												res.addFrame(ui_props.animation.frame+1).paste(res.getFrame(ui_props.animation.frame));
												animationSelectFrame(ui_props.animation.frame+1);
												uiUpdateProperties();
												uiUpdateCurrentDisplayView();
											}
										},
										{
											"name": "Remove",
											"click": function(opt){
												if(res.getTotalFrames()>1){
													res.removeFrame(ui_props.animation.frame);
													uiUpdateProperties();
													uiUpdateCurrentDisplayView();
												}
												else{
													alert("You cannot remove the only frame!");
												}
											}
										}
									]);
								}
								//
								//	MANAGES ACTION
								//
								if(el.type==TME_ACTION){
									uiCreateDropdown({"x":ev.clientX, "y":ev.clientY, "width":0}, [
										{
											"name": "Replicate To",
											"click": function(opt){
												var set = ui_props.animation.frame;
												var end = el.frame_index;
												if(end<set){
													animationCurrent().getFrame(end).paste(animationCurrent().getFrame(set));
												}
												animationReplicate(
													animationGetSelectedObject(),
													set>end? end: set, end<set? set: end);
											}
										},
										{
											"name": "Tween To",
											"click": function(opt){
												var set = ui_props.animation.frame;
												var end = el.frame_index;
												animationTween(
													animationGetSelectedObject(),
													set>end? end: set, end<set? set: end,
													confirm("Tween with rotation?"),
													ev.altKey? Number(prompt("Curve: ", 2))||1: 1);
											}
										},
										{
											"name": "Remove To",
											"click": function(opt){
												var set = ui_props.animation.frame;
												var end = el.frame_index;
												var b = set>end? end: set;
												var e = set>end? set: end;
												b = b==0? 1: b;
												e = e==0? 1: e;
												if(confirm("Do you wanna to remove the frames from '"+b+"' to '"+e+"'?")){
													for(; e>=b; e--){
														res.removeFrame(b);
													}
												}
												animationSelectFrame(ui_props.animation.frame-1);
												uiUpdateProperties();
												uiUpdateCurrentDisplayView();
											}
										}
									]);
								}
							}
						}
					});
				}
				break;
			}
		}
	}
	
	function _uiSetupViewEvents(canvas){
		canvas.onmouseenter = function(){
			ui_props.input.in = canvas;
		}
		canvas.onmouseout = function(){
			ui_props.input.in = null;
		}
		canvas.onmousedown = function(ev){
			var x = ev.offsetX;
			var y = ev.offsetY;
			ui_props.input.cursors[ev.button].x = x;
			ui_props.input.cursors[ev.button].y = y;
			ui_props.input.cursors[ev.button].dx = 0;
			ui_props.input.cursors[ev.button].dy = 0;
			ui_props.input.view[ev.button] = canvas;
			ui_props.input.hold[ev.button] = true;
			ui_props.input.ltime[ev.button] = (new Date()).getTime();
			if(canvas._onmousedown){
				canvas._onmousedown(ev.button, x, y, ev);
			}
		}
		document.body.pool_onmouseup.push(function(ev){
			var x = ev.offsetX;
			var y = ev.offsetY;
			ui_props.input.view[ev.button] = null;
			ui_props.input.hold[ev.button] = false;
			if(canvas._onmouseup){
				canvas._onmouseup(ev.button, x, y, ev);
			}
		});
		canvas.onmouseup = function(ev){
			var x = ev.offsetX;
			var y = ev.offsetY;
			if(((new Date()).getTime()) - (ui_props.input.ltime[ev.button]) <= 170){
				if(canvas._onmousetap){
					canvas._onmousetap(ev.button, x, y, ev);
				}
			}
		}
		canvas.onwheel = canvas.onmousewheel = function(ev){
			var x = ev.offsetX;
			var y = ev.offsetY;
			if(canvas._onmousewheel){
				canvas._onmousewheel(ev.deltaY/100, ev);
			}
		}
		canvas.onmousemove = function(ev){
			var x = ev.offsetX;
			var y = ev.offsetY;
			ui_props.input.in = canvas;
			ui_props.input.position.x = x;
			ui_props.input.position.y = y;
		}
		document.body.pool_onmousemove.push(function(ev){
			var x = ev.clientX-canvas.getBoundingClientRect().left;
			var y = ev.clientY-canvas.getBoundingClientRect().top;
			for(var i=0; i<3; i++){
				if(ui_props.input.hold[i] && ui_props.input.view[i]==canvas){
					//console.log(ui_props.input.cursors[i].dx);
					//console.log(ui_props.input.cursors[i].x);
					ui_props.input.cursors[i].dx = x - ui_props.input.cursors[i].x;
					ui_props.input.cursors[i].dy = y - ui_props.input.cursors[i].y;
					ui_props.input.cursors[i].x = x;
					ui_props.input.cursors[i].y = y;
					if(canvas._onmousedrag){
						canvas._onmousedrag(i, ui_props.input.cursors[i].dx, ui_props.input.cursors[i].dy, x, y, ev);
					}
				}
			}
		});
	}
	
	_uiSetupViewEvents(display_regular);
	_uiSetupViewEvents(animation_view);
	_uiSetupViewEvents(animation_timeline);
	function _uiAppendViewEvents(canvas, options={}){
		canvas._onmousedown = options.onmousedown||function(){};
		canvas._onmouseup = options.onmouseup||function(){};
		canvas._onmousetap = options.onmousetap||function(){};
		canvas._onmousewheel = options.onmousewheel||function(){};
		canvas._onmousedrag = options.onmousedrag||function(){};
	}
	
	function uiGetViewMatrix(bmp){
		var width = bmp.getWidth();
		var height = bmp.getHeight();
		var mat = new Matrix3x2();
		mat.translate(ui_props.view.x, ui_props.view.y);
		mat.scale(ui_props.view.zoom, ui_props.view.zoom);
		mat.translate(width/2, height/2);
		return mat;
	}
	
	const TME_GAP = 0;
	const TME_OBJ = 1;
	const TME_ADDOBJ = 2;
	const TME_FRAME = 3;
	const TME_BOTTOM = 4;
	const TME_ACTION = 5;
	const TME_EMPTY = 6;
	function uiGetTimelineElement(x, y){
		var width = bmptd.getWidth();
		var height = bmptd.getHeight();
		if(x < ui_props.timeline.layout.left_margin){
			var o_i = ((height-ui_props.timeline.layout.bottom_margin) - y)/(ui_props.timeline.layout.obj_height);
			if(o_i < 0){
				return {"type": TME_GAP};
			}
			else{
				o_i += ui_props.timeline.y;
				if(o_i >= ui_props.animation.objects.length){
					return {"type": TME_ADDOBJ};
				}
				else{
					return {"type": TME_OBJ, "object": ui_props.animation.objects[~~o_i]};
				}
			}
		}
		else if(y >= (height-ui_props.timeline.layout.bottom_margin)){
			var f_i = ((x - ui_props.timeline.layout.left_margin)/(ui_props.timeline.layout.frame_width)) / ui_props.timeline.zoom;
			f_i += ui_props.timeline.x;
			if(f_i >= ui_props.animation.frames.length){
				return {"type": TME_BOTTOM};
			}
			else{
				return {"type": TME_FRAME, "frame": ui_props.animation.frames[~~f_i], "frame_index": ~~f_i};
			}
		}
		else{
			var o_i = ((height-ui_props.timeline.layout.bottom_margin) - y)/(ui_props.timeline.layout.obj_height);
			o_i += ui_props.timeline.y;
			var f_i = ((x - ui_props.timeline.layout.left_margin)/(ui_props.timeline.layout.frame_width)) / ui_props.timeline.zoom;
			f_i += ui_props.timeline.x;
			if(o_i >= ui_props.animation.objects.length || f_i >= ui_props.animation.frames.length){
				return {"type": TME_EMPTY};
			}
			else{
				return {"type": TME_ACTION, "action": null, "object": ui_props.animation.objects[~~o_i], "frame": ui_props.animation.frames[~~f_i], "frame_index": ~~f_i};
			}
		}
		return {"type": TME_GAP};
	}
	
	function _uiViewTransform(bmp){
		var width = bmp.getWidth();
		var height = bmp.getHeight();
		bmp.translate(width/2, height/2);
		bmp.scale(ui_props.view.zoom, ui_props.view.zoom);
		bmp.translate(ui_props.view.x, ui_props.view.y);
	}
	
	function _uiDrawRegularBase(bmp){
		bmp.setMatrix();
		
		var width = bmp.getWidth();
		var height = bmp.getHeight();
		bmp.setFillStyle("#CCC");
		bmp.fillRect(0, 0, width, height);
		var sqs = 32;
		bmp.setFillStyle("#AAA");
		for(var x=0; x<width; x+=sqs){
			for(var y=(x%(sqs*2)); y<height; y+=(sqs*2)){
				bmp.fillRect(x, y, sqs, sqs);
			}
		}
		
		_uiViewTransform(bmp);
	}
	
	function _uiUpdateImageDisplay(bmp){
		var res = getSelectedResource();
		
		_uiDrawRegularBase(bmp);
		bmp.drawImage(res.getThumb());
	}
	
	function _uiUpdateSourceDisplay(bmp){
		var res = getSelectedResource();
		var rect = res.getRect();
		
		_uiDrawRegularBase(bmp);
		var image = res.getImage().getThumb();
		var width = image.width;
		var height = image.height;
		bmp.drawImage(image);
		
		// Draw transparency panel
		bmp.setFillStyle("black");
		bmp.setAlpha(0.5);
		bmp.fillRect(0, 0, width, rect.y);
		bmp.fillRect(0, rect.y+rect.h, width, height-(rect.y+rect.h));
		bmp.fillRect(0, rect.y-.2, rect.x, rect.h+.4);
		bmp.fillRect(rect.x+rect.w, rect.y-.2, width-(rect.x+rect.w), rect.h+.4);
		
		// Draw red bars
		{
			var mat = uiGetViewMatrix(bmp);
			bmp.setMatrix();
			var rb = (new Vector2(rect.x, rect.y)).transform(mat);
			var re = (new Vector2(rect.x+rect.w, rect.y+rect.h)).transform(mat);
			bmp.setAlpha(1);
			bmp.setLineWidth(3);
			bmp.setStrokeStyle("red");
			bmp.strokeLine(rb.x, rb.y, re.x, rb.y);
			bmp.strokeLine(rb.x, rb.y, rb.x, re.y);
			bmp.strokeLine(re.x, rb.y, re.x, re.y);
			bmp.strokeLine(rb.x, re.y, re.x, re.y);
			bmp.setFillStyle("#F80");
			bmp.fillCircle(rb.x, rb.y, 12);
			bmp.fillCircle(re.x, rb.y, 12);
			bmp.fillCircle(rb.x, re.y, 12);
			bmp.fillCircle(re.x, re.y, 12);
		}
	}
	
	function _uiUpdateObjectDisplay(bmp){
		var res = getSelectedResource();
		
		_uiDrawRegularBase(bmp);
		bmp.drawImage(res.getThumb());
		var offset = res.getOrigin();
		
		{
			var mat = uiGetViewMatrix(bmp);
			bmp.setMatrix();
			var off = (new Vector2(offset.x, offset.y)).transform(mat);
			bmp.setFillStyle("#000");
			bmp.fillRect(off.x-3, off.y-12, 6, 24);
			bmp.fillRect(off.x-12, off.y-3, 24, 6);
			bmp.setFillStyle("#FFF");
			bmp.fillRect(off.x-1, off.y-10, 2, 20);
			bmp.fillRect(off.x-10, off.y-1, 20, 2);
		}
	}
	
	function _uiUpdateAnimationDisplay(bmp, tbmp){
		_uiUpdateAnimationView(bmp);
		_uiUpdateTimelineView(tbmp);
	}
	
	function _uiUpdateAnimationView(bmp){
		var res = getSelectedResource();
		
		var width = bmp.getWidth();
		var height = bmp.getHeight();
		
		// Render gray background
		bmp.setMatrix();
		bmp.setFillStyle("#AAA");
		bmp.fillRect(0, 0, width, height);
		
		// Render white frame of scene
		bmp.pushMatrix();
		_uiViewTransform(bmp);
		bmp.setFillStyle("#FFF");
		bmp.fillRect(-256, -256, 512, 512);
		bmp.popMatrix();
		
		// Render the line dividers of scene
		bmp.setStrokeStyle("black");
		var mat = uiGetViewMatrix(bmp);
		var ct = (new Vector2(0, -256)).transform(mat);
		var cb = (new Vector2(0, 256)).transform(mat);
		var cl = (new Vector2(-256, 0)).transform(mat);
		var cr = (new Vector2(256, 0)).transform(mat);
		bmp.setLineWidth(2);
		bmp.setStrokeStyle("black");
		bmp.strokeLine(ct.x, ct.y, cb.x, cb.y);
		bmp.strokeLine(cl.x, cl.y, cr.x, cr.y);
		
		// Render the scene
		bmp.pushMatrix();
		_uiViewTransform(bmp);
		var incobjs = res.getIncludedObjects();
		
		//var sprite_frame = new BitmapImage();
		
		for(var oi=0; oi<incobjs.length; oi++){
			var obj = incobjs[oi];
			var action = animationGetObjectAction(obj);
			var resource = action.getSource();
			bmp.pushMatrix();
			bmp.mulMatrix(action.getTransform());
			if(action.isVisible() && !obj.getMeta("_invisible")){
				var flipx = action.isFlipX()?-1:1;
				var flipy = action.isFlipY()?-1:1;
				bmp.scale(flipx, flipy);
				bmp.setAlpha(action.getColor().a);
				var sprite_frame = action.getThumb();
				bmp.drawImage(sprite_frame, 0, 0, sprite_frame.getWidth()*flipx, sprite_frame.getHeight()*flipy);
				bmp.setAlpha(1);
			}
			bmp.popMatrix();
			
			{
				bmp.popMatrix();
				bmp.pushMatrix();
				bmp.setMatrix();
				
				var omat = action.getTransform().clone();
				omat.mul(uiGetViewMatrix(bmp));//action.getTransform());
				var offset = obj.getOrigin();
				
				var tl = (new Vector2(0, 0)).transform(omat);
				var tr = (new Vector2(resource.getThumb().getWidth(), 0)).transform(omat);
				var bl = (new Vector2(0, resource.getThumb().getHeight())).transform(omat);
				var br = (new Vector2(resource.getThumb().getWidth(), resource.getThumb().getHeight())).transform(omat);
				bmp.setStrokeStyle(animationGetSelectedObject().includes(obj)? (animationGetSelectedObject()[0] == obj? "red": "purple"):
					(obj.getMeta("_locked")?"#555":"blue")
				);
				bmp.setLineWidth(obj.getMeta("_locked")||obj.getMeta("_invisible")?1:2);
				bmp.strokeLine(tl.x, tl.y, tr.x, tr.y);
				bmp.strokeLine(tl.x, tl.y, bl.x, bl.y);
				bmp.strokeLine(bl.x, bl.y, br.x, br.y);
				bmp.strokeLine(tr.x, tr.y, br.x, br.y);
				
				bmp.popMatrix();
				bmp.pushMatrix();
				_uiViewTransform(bmp);
			}
		}
		if(animationGetSelectedObject()[0]){
			bmp.popMatrix();
			bmp.pushMatrix();
			bmp.setMatrix();
			
			//var omat = action.getTransform();//uiGetViewMatrix(bmp);
			//omat.mul(uiGetViewMatrix(bmp));
			var obj = animationGetSelectedObject()[0];
			var action = animationGetObjectAction(obj);
			var omat = action.getTransform().clone();
			omat.mul(uiGetViewMatrix(bmp));//action.getTransform());
			var offset = obj.getOrigin();
			
			var off = new Vector2(offset.x, offset.y);
			off.transform(omat);
			bmp.setFillStyle("#000");
			bmp.fillRect(off.x-3, off.y-12, 6, 24);
			bmp.fillRect(off.x-12, off.y-3, 24, 6);
			bmp.setFillStyle("#FFF");
			bmp.fillRect(off.x-1, off.y-10, 2, 20);
			bmp.fillRect(off.x-10, off.y-1, 20, 2);
			
			bmp.popMatrix();
			bmp.pushMatrix();
			_uiViewTransform(bmp);
		}
		if(ui_props.selection.active){
			bmp.popMatrix();
			bmp.pushMatrix();
			bmp.setMatrix();
			
			var mat = uiGetViewMatrix(bmp);
			var v0 = new Vector2(ui_props.selection.x, ui_props.selection.y);
			v0.transform(mat);
			var v1 = new Vector2(ui_props.selection.x+ui_props.selection.w, ui_props.selection.y);
			v1.transform(mat);
			var v2 = new Vector2(ui_props.selection.x+ui_props.selection.w, ui_props.selection.y+ui_props.selection.h);
			v2.transform(mat);
			var v3 = new Vector2(ui_props.selection.x, ui_props.selection.y+ui_props.selection.h);
			v3.transform(mat);
			
			bmp.setStrokeStyle("#000");
			bmp.setLineWidth(8);
			bmp.strokeLine(v0.x, v0.y, v1.x, v1.y);
			bmp.strokeLine(v1.x, v1.y, v2.x, v2.y);
			bmp.strokeLine(v2.x, v2.y, v3.x, v3.y);
			bmp.strokeLine(v3.x, v3.y, v0.x, v0.y);
			
			bmp.setStrokeStyle("#FFF");
			bmp.setLineWidth(2);
			bmp.strokeLine(v0.x, v0.y, v1.x, v1.y);
			bmp.strokeLine(v1.x, v1.y, v2.x, v2.y);
			bmp.strokeLine(v2.x, v2.y, v3.x, v3.y);
			bmp.strokeLine(v3.x, v3.y, v0.x, v0.y);
			
			bmp.popMatrix();
			bmp.pushMatrix();
			_uiViewTransform(bmp);
		}
		bmp.popMatrix();
		
		// Render the ui
		//
		bmp.setFillStyle("black");
		bmp.setFont(20, "Arial");
		var axyt = "";
		switch(ui_props.animation.axys){
			case ANM_X:{
				axyt = "X:";
			}
			break;
			case ANM_Y:{
				axyt = "Y:";
			}
			break;
			case ANM_LOCK:{
				axyt = "LOCKED:";
			}
			break;
		}
		switch(ui_props.animation.mode){
			case ANM_DRAG:{
				bmp.fillText(axyt+"Drag", 5, 25);
			}
			break;
			case ANM_TRANSLATE:{
				bmp.fillText(axyt+"Translate", 5, 25);
			}
			break;
			case ANM_SCALE:{
				bmp.fillText(axyt+"Scale", 5, 25);
			}
			break;
			case ANM_SKEW:{
				bmp.fillText(axyt+"Skew", 5, 25);
			}
			break;
			case ANM_ROTATE:{
				bmp.fillText("Rotate", 5, 25);
			}
			break;
			case ANM_ORIGIN:{
				bmp.fillText(axyt+"Origin", 5, 25);
			}
			break;
			case ANM_SELECT:{
				bmp.fillText("Select", 5, 25);
			}
			break;
		}
		{
			var p = new Vector2(0, 0);
			if(ui_props.input.in == animation_view){
				p.x = ui_props.input.position.x;
				p.y = ui_props.input.position.y;
				p.untransform(uiGetViewMatrix(bmpad));
			}
			bmp.fillText("x: "+(p.x).toFixed(2)+"; y:"+(p.y).toFixed(2), 5, 50);
		}
	}
	
	function _uiUpdateTimelineView(bmp){
		var res = getSelectedResource();
		
		var width = bmp.getWidth();
		var height = bmp.getHeight();
		
		ui_props.timeline.x = ui_props.timeline.x<0? 0: ui_props.timeline.x>(ui_props.animation.frames.length-1)?(ui_props.animation.frames.length>0? (ui_props.animation.frames.length-1):0):ui_props.timeline.x;
		ui_props.timeline.y = ui_props.timeline.y<0? 0: ui_props.timeline.y>(ui_props.animation.objects.length-1)?(ui_props.animation.objects.length>0? (ui_props.animation.objects.length-1):0): ui_props.timeline.y;
		
		var l_margin = ui_props.timeline.layout.left_margin;
		var b_margin = ui_props.timeline.layout.bottom_margin;
		var o_height = ui_props.timeline.layout.obj_height;
		var o_pos = ui_props.timeline.y;
		var o_total = ui_props.animation.objects.length;
		var f_width = ui_props.timeline.layout.frame_width*ui_props.timeline.zoom;
		var f_pos = ui_props.timeline.x;
		var f_seek = ui_props.timeline.time;
		var f_actual = ui_props.animation.frame;
		var f_total = ui_props.animation.frames.length;
		
		bmp.setFillStyle("#666666");
		bmp.fillRect(0, 0, width, height);
		
		// Renderize frames grid
		{
			var f_i = ~~f_pos; // Index of current frame in iteration
			bmp.setLineWidth(2);
			bmp.setStrokeStyle("black");
			for(var f_p=(((-f_pos)%1)*f_width + l_margin); f_p<width && f_i<f_total; f_p+=f_width, f_i++){
				bmp.setFillStyle(f_actual==f_i?"#BBA04C":"#888888");
				bmp.fillRect(f_p, 0, f_width, height);
				bmp.strokeRect(f_p, -2, f_width, height);
				
				var o_i = ~~(o_pos); // Index of current object in iteration
				bmp.setLineWidth(2);
				for(var o_p=(((o_pos)%1)*o_height + (height-b_margin)); o_p>0 && o_i<o_total; o_p-=o_height, o_i++){
					bmp.setFillStyle(f_actual==f_i?"#88A8C0":(ui_props.animation.selected.includes(ui_props.animation.objects[o_i]))?"#A0CFFF":
						"#5088DD");
					bmp.fillRect(f_p, o_p, f_width, -o_height);
					bmp.strokeRect(f_p, o_p, f_width, -o_height);
				}
			}
		}
		
		// Renderize objects side
		{
			bmp.setFillStyle("#888888");
			bmp.fillRect(0, 0, l_margin, height);
			var o_i = ~~(o_pos); // Index of current object in iteration
			bmp.setLineWidth(2);
			bmp.setFont(o_height-12, "arial");
			var o_p = (((o_pos)%1)*o_height + (height-b_margin));
			for(; o_p>0 && o_i<o_total; o_p-=o_height, o_i++){
				bmp.setFillStyle((ui_props.animation.selected.includes(ui_props.animation.objects[o_i]))?"#CCCCCC":"#888888");
				bmp.fillRect(0, o_p, l_margin, -o_height);
				bmp.strokeRect(-2, o_p, width+4, -o_height);
				bmp.setFillStyle("black");
				bmp.fillText(ui_props.animation.objects[o_i].getName(), 8, o_p-8);
			}
			// Drawing plus for objects
			bmp.setFillStyle("black");
			bmp.fillRect(l_margin/2-1, o_p - o_height*1.3, 2, o_height);
			bmp.fillRect(l_margin/2 - o_height*.5, o_p-o_height*0.8-1, o_height, 2);
		}
		
		// Renderize frames bottom
		{
			bmp.setFillStyle("#888888");
			bmp.fillRect(0, height-b_margin, width, b_margin);
			var f_i = ~~f_pos; // Index of current frame in iteration
			bmp.setLineWidth(2);
			var font_size = b_margin-15;
			bmp.setFont(font_size, "arial");
			for(var f_p=(((-f_pos)%1)*f_width + l_margin); f_p<width && f_i<f_total; f_p+=f_width, f_i++){
				bmp.setFillStyle(f_actual==f_i?"#BBA04C":"#888888");
				bmp.fillRect(f_p, height-b_margin, f_width, b_margin);
				bmp.setStrokeStyle("black");
				bmp.strokeRect(f_p, height-b_margin, f_width, b_margin);
				bmp.setFillStyle("black");
				bmp.fillText(f_i, f_p+4, height-b_margin+font_size+2);
			}
		}
		
		// Renderize bottom left part
		bmp.setLineWidth(2);
		bmp.setFillStyle("#888888");
		bmp.fillRect(0, height-b_margin, l_margin, b_margin);
		bmp.setStrokeStyle("black");
		bmp.strokeRect(0, height-b_margin-1, width, 2);
		bmp.strokeRect(l_margin-1, 0, 2, height);
	}
	
	var player_reproduction = null;
	player_close.onclick = function(){
		player_view.style.visibility = 'hidden';
		pafpStopReproduction(player_reproduction);
	}
	
	window.addEventListener('keydown', function(ev){
		if(ui_props.input.in==animation_view || ui_props.input.in==animation_timeline){
			switch(ev.key){
				case "a":{
					var objs = animationCurrent().getIncludedObjects();
					if(animationGetSelectedObject().length!=objs.length){
						for(var i=0; i<objs.length; i++){
							animationSelectObject(objs[i], 1);
						}
					}
					else{
						for(var i=0; i<objs.length; i++){
							animationSelectObject(objs[i], -2);
						}
					}
				}
				break;
				case "c":{
					if(ev.ctrlKey){
						var objs = animationGetSelectedObject();
						ui_props.clipboard.length = 0;
						for(var i=0; i<objs.length; i++){
							var action = animationGetObjectAction(objs[i]);
							ui_props.clipboard.push(action);
						}
					}
				}
				break;
				case "v":{
					if(ev.ctrlKey){
						for(var i=0; i<ui_props.clipboard.length; i++){
							var action = ui_props.clipboard[i];
							animationGetCurrentFrame().pasteAction(action);
						}
					}
					else{
						ui_props.animation.axys |= ANM_X|ANM_Y;
						ui_props.animation.mode = ANM_DRAG;
					}
					uiUpdateCurrentDisplayView();
				}
				break;
				case "t":{
					ui_props.animation.axys |= ANM_X|ANM_Y;
					ui_props.animation.mode = ANM_TRANSLATE;
					uiUpdateCurrentDisplayView();
				}
				break;
				case "s":{
					ui_props.animation.axys |= ANM_X|ANM_Y;
					ui_props.animation.mode = ANM_SCALE;
					uiUpdateCurrentDisplayView();
				}
				break;
				case "k":{
					ui_props.animation.axys |= ANM_X|ANM_Y;
					ui_props.animation.mode = ANM_SKEW;
					uiUpdateCurrentDisplayView();
				}
				break;
				case "r":{
					ui_props.animation.axys |= ANM_X|ANM_Y;
					ui_props.animation.mode = ANM_ROTATE;
					uiUpdateCurrentDisplayView();
				}
				break;
				case "o":{
					ui_props.animation.axys |= ANM_X|ANM_Y;
					ui_props.animation.mode = ANM_ORIGIN;
					uiUpdateCurrentDisplayView();
				}
				break;
				case "x":{
					ui_props.animation.axys ^= ANM_Y;
					uiUpdateCurrentDisplayView();
				}
				break;
				case "z":{
					if(Input.ctrlKey){
						animationUndo();
					}
					uiUpdateCurrentDisplayView();
				}
				break;
				case "y":{
					if(Input.ctrlKey){
						animationRedo();
					}
					else{
						ui_props.animation.axys ^= ANM_X;
					}
					uiUpdateCurrentDisplayView();
				}
				break;
				case "b":{
					ui_props.animation.axys |= ANM_X|ANM_Y;
					ui_props.animation.mode = ANM_SELECT;
					uiUpdateCurrentDisplayView();
				}
				break;
				case "ArrowLeft":{
					if(ev.shiftKey){
						ui_props.timeline.x = 0;
						animationSelectFrame(0);
					}
					else if(ev.altKey){
						ui_props.timeline.x = 0;
						animationSelectFrame(ui_props.animation.frame);
					}
					else if(ev.ctrlKey){
						ui_props.timeline.x = ui_props.animation.frame-11;
						animationSelectFrame(ui_props.animation.frame-10);
					}
					else{
						ui_props.timeline.x = ui_props.animation.frame-2;
						animationSelectFrame(ui_props.animation.frame-1);
					}
				}
				break;
				case "ArrowRight":{
					if(ev.shiftKey){
						ui_props.timeline.x = animationCurrent().getTotalFrames()-1;
						animationSelectFrame(animationCurrent().getTotalFrames()-1);
					}
					else if(ev.altKey){
						ui_props.timeline.x = animationCurrent().getTotalFrames()-1;
						animationSelectFrame(ui_props.animation.frame);
					}
					else if(ev.ctrlKey){
						ui_props.timeline.x = ui_props.animation.frame+10;
						animationSelectFrame(ui_props.animation.frame+11);
					}
					else{
						ui_props.timeline.x = ui_props.animation.frame;
						animationSelectFrame(ui_props.animation.frame+1);
					}
				}
				break;
				case "PageUp":{
					var anim = animationCurrent();
					if(!display_animation.hidden){
						var objs = animationGetSelectedObject();
						var keep = null;
						for(var i=0; i<objs.length; i++){
							var index = anim.indexOfIncludedObject(objs[i]);
							anim.moveIncludedObject(objs[i], index+1);
						}
						uiUpdateResourcesList();
						uiUpdateProperties();
						uiUpdateCurrentDisplayView();
					}
				}
				break;
				case "PageDown":{
					var anim = animationCurrent();
					if(!display_animation.hidden){
						var objs = animationGetSelectedObject();
						for(var i=0; i<objs.length; i++){
							var index = anim.indexOfIncludedObject(objs[i]);
							anim.moveIncludedObject(objs[i], index-1);
						}
						uiUpdateResourcesList();
						uiUpdateProperties();
						uiUpdateCurrentDisplayView();
					}
				}
				break;
				case "F9":{
					player_view.style.visibility = 'visible';
					player_reproduction = pafpReproduceAnimation(project, animationCurrent().getName(), player_display, {});
				}
				break;
			}
		}
	});
}
