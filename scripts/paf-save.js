
function pafSaveProject(proj){
	var datajs = {};
	
	proj.cleanup();
	
	// Setup data
	// Properties
	datajs.properties = {
		"fps": proj.fps,
		"project_version": proj.project_version,
		"grid": proj.grid
	};
	// Images
	{
		var images = proj.getAllImages();
		datajs.images = [];
		for(var i=0; i<images.length; i++){
			images[i].setMeta("_index", i);
			datajs.images[i] = {
				"name": images[i].getName(),
				"uri": images[i].getBitmap().toDataURI()
			};
		}
	}
	// Sources
	{
		var sources = proj.getAllSources();
		datajs.sources = [];
		for(var i=0; i<sources.length; i++){
			sources[i].setMeta("_index", i);
			datajs.sources[i] = {
				"image": sources[i].getImage().getMeta("_index"),
				"rect": [
					sources[i].getRect().x, sources[i].getRect().y, sources[i].getRect().w, sources[i].getRect().h
				]
			};
		}
	}
	// Objects
	{
		var objects = proj.getAllObjects();
		datajs.objects = [];
		for(var i=0; i<objects.length; i++){
			objects[i].setMeta("_index", i);
			datajs.objects[i] = {
				"name": objects[i].getName(),
				"source": objects[i].getSource().getMeta("_index"),
				"origin": [objects[i].getOrigin().x, objects[i].getOrigin().y]
			};
		}
	}
	// Animations
	{
		var animations = proj.getAllAnimations();
		datajs.animations = [];
		for(var i=0; i<animations.length; i++){
			animations[i].setMeta("_index", i);
			var frames = [];
			
			// Include objects
			var inc = animations[i].getIncludedObjects();
			var include = [];
			for(var n=0; n<inc.length; n++){
				include.push(inc[n].getMeta("_index"));
			}
			
			// Frames
			var _frames = animations[i].getAllFrames();
			for(var f=0; f<_frames.length; f++){
				var frame = {
					"actions": []
				};
				
				// Actions
				var _actions = _frames[f].getAllActions();
				for(var a=0; a<_actions.length; a++){
					var _action = _actions[a];
					var action = {
						"object": _action.getObject().getMeta("_index"),
						"visible": _action.isVisible(),
						"trigger": _action.getTrigger(),
						"source": _action.getSource().getMeta("_index"),
						"transform": [
							_action.getTransform().a, _action.getTransform().b, _action.getTransform().c,
							_action.getTransform().d, _action.getTransform().x, _action.getTransform().y
						],
						"color": [
							_action.getColor().r, _action.getColor().g, _action.getColor().b, _action.getColor().a
						],
						"flip_x": _action.isFlipY(),
						"flip_y": _action.isFlipY()
					};
					frame.actions.push(action);
				}
				
				frames.push(frame);
			}
			
			datajs.animations[i] = {
				"name": animations[i].getName(),
				"include": include,
				"frames": frames
			}
		}
	}
	
	// Saving file to disk
	var file = File.openString(JSON.stringify(datajs, null, 4));
	file.name = "project.pafproj";
	file.saveAsText();
}

function pafLoadProject(proj, file){
	var datajs = JSON.parse(file);
	
	// Setup data
	// Properties
	proj.fps = datajs.properties.fps;
	proj.project_version = datajs.properties.project_version;
	proj.grid = isNaN(datajs.properties.grid)? 1: datajs.properties.grid;
	// Images
	{
		for(var i=0; i<datajs.images.length; i++){
			proj.createImage(
				datajs.images[i].name,
				new BitmapImage()
			);
			var bitmap = new BitmapImage(
				datajs.images[i].uri,
				function(img, i){
					proj.getImage(i).setBitmap(img);
					workspace.updateFace();
				}, i
			);
		}
	}
	// Sources
	{
		for(var i=0; i<datajs.sources.length; i++){
			proj.createSource(
				proj.getImage(datajs.sources[i].image),
				new Rect(datajs.sources[i].rect[0], datajs.sources[i].rect[1], datajs.sources[i].rect[2], datajs.sources[i].rect[3])
			);
		}
	}
	// Objects
	{
		for(var i=0; i<datajs.objects.length; i++){
			proj.createObject(
				proj.getSource(datajs.objects[i].source),
				datajs.objects[i].name,
				new Vector2(datajs.objects[i].origin[0], datajs.objects[i].origin[1])
			);
		}
	}
	// Animations
	{
		for(var i=0; i<datajs.animations.length; i++){
			var anim = proj.createAnimation(datajs.animations[i].name);
			
			var objs = [];
			
			for(var f=0; f<datajs.animations[i].frames.length; f++){
				var frame = anim.addFrame();
				for(var a=0; a<datajs.animations[i].frames[f].actions.length; a++){
					var _action = datajs.animations[i].frames[f].actions[a];
					var object = proj.getObject(_action.object);
					var action = frame.createAction(object);
					action.setVisible(_action.visible==true);
					action.setTrigger(_action.trigger);
					action.setSource(proj.getSource(_action.source));
					action.getTransform().set(
						_action.transform[0], _action.transform[1], _action.transform[2],
						_action.transform[3], _action.transform[4], _action.transform[5]
					);
					action.getColor().set(
						_action.color[0], _action.color[1], _action.color[2], _action.color[3]
					);
					action.setFlipX(_action.flipx==true);
					action.setFlipY(_action.flipy==true);
					
					if(!objs.includes(object)){
						objs.push(object);
					}
				}
			}
			
			var include = datajs.animations[i].include;
			if(include){
				for(var o=0; o<include.length; o++){
					anim.includeObject(proj.getObject(include[o]));
				}
			}
			else{
				for(var o=0; o<objs.length; o++){
					anim.includeObject(objs[o]);
				}
			}
		}
	}
}
