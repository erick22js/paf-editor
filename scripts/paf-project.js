
function PAFProject(){
	var self = this;
	var _project = self;
	
	// PROJECT Properties
	_project.project_version = 1;
	_project.fps = 30;
	_project.grid = 1;
	
	// PROJECT Resources managment
	var _resources = {};
	var _rid = BigInt(1000000000);
	function genID(){
		var o_rid = _rid;
		_rid += BigInt(1);
		return o_rid;
	}
	function createResource(){
		var res = {};
		var id = ""+genID();
		_resources[id] = res;
		res._id = id;
		return id;
	}
	function getResource(id){
		var res = _resources[id];
		return res;
	}
	function freeResource(id){
		delete _resources[id];
	}
	
	// PROJECT Resources References
	var images = [];
	var sources = [];
	var objects = [];
	var animations = [];
	
	// INNER Classes
	function PAFResource(type="PAFResource"){
		var self = this;
		self._owner = _project;
		self._idR = createResource();
		self._removed = false;
		getResource(self._idR)._type = type;
		getResource(self._idR).meta = {};
		
		self.getType = function(){return type};
		
		self.getMeta = function(name){return getResource(self._idR).meta[name]};
		self.setMeta = function(name, data=null){getResource(self._idR).meta[name] = data};
		self.hasMeta = function(name){return typeof(getResource(self._idR).meta[name]) != 'undefined'};
		self.deleteMeta = function(name){getResource(self._idR).meta[name] = undefined};
	}
	function PAFImage(iname="", ibitmap=null){
		var self = this;
		PAFResource.call(self, "PAFImage");
		getResource(self._idR).name = iname;
		getResource(self._idR).bitmap = ibitmap;
		
		self.getName = function(){return getResource(self._idR).name};
		self.setName = function(iname){getResource(self._idR).name = iname};
		self.getBitmap = function(){return getResource(self._idR).bitmap};
		self.setBitmap = function(ibitmap){
			getResource(self._idR).bitmap = ibitmap;
			updateSourcesThumbByImage(self);
		};
		self.getThumb = function(){return getResource(self._idR).bitmap};
		self.updateThumb = function(){
			updateSourcesThumbByImage(self);
		};
	}
	function PAFSource(simage, srect=(new Rect(0, 0, simage.getBitmap().getWidth(), simage.getBitmap().getHeight()))){
		var self = this;
		PAFResource.call(self, "PAFSource");
		getResource(self._idR).image = simage;
		getResource(self._idR).rect = srect;
		getResource(self._idR).bitmap = (new BitmapImage());
		
		self.getImage = function(){return getResource(self._idR).image};
		self.setImage = function(simage){getResource(self._idR).image = simage};
		self.getRect = function(){return getResource(self._idR).rect};
		self.getThumb = function(){return getResource(self._idR).bitmap};
		self.updateThumb = function(){
			var rect = getResource(self._idR).rect;
			getResource(self._idR).bitmap.setImage(getResource(self._idR).image.getBitmap(), 0, 0, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
			updateObjectsThumbBySource(self)
		};
		
		self.updateThumb();
	}
	function PAFObject(osource, oname="", oorigin=(new Vector2())){
		var self = this;
		PAFResource.call(self, "PAFObject");
		getResource(self._idR).name = oname;
		getResource(self._idR).source = osource;
		getResource(self._idR).origin = oorigin;
		getResource(self._idR).bitmap = (new BitmapImage());
		
		self.getName = function(){return getResource(self._idR).name};
		self.setName = function(oname){getResource(self._idR).name = oname};
		self.getSource = function(){return getResource(self._idR).source};
		self.setSource = function(osource){getResource(self._idR).source = osource};
		self.getOrigin = function(){return getResource(self._idR).origin};
		self.getThumb = function(){return getResource(self._idR).bitmap};
		self.updateThumb = function(){
			getResource(self._idR).bitmap.setImage(self.getSource().getThumb());
		}
		
		self.updateThumb();
	}
	function PAFAction(aobject, avisible=true, atrigger=null, asource=aobject.getSource(), atransform=(new Matrix3x2()), acolor=(new Color()), aflipx=false, aflipy=false, aactive=false){
		var self = this;
		PAFResource.call(self, "PAFAction");
		getResource(self._idR).object = aobject;
		getResource(self._idR).visible = avisible;
		getResource(self._idR).trigger = atrigger;
		getResource(self._idR).source = asource;
		getResource(self._idR).transform = atransform;
		getResource(self._idR).color = acolor;
		getResource(self._idR).flipx = aflipx;
		getResource(self._idR).flipy = aflipy;
		getResource(self._idR).active = aactive;
		getResource(self._idR).bitmap = (new BitmapImage());
		
		self.getObject = function(){return getResource(self._idR).object};
		self.isVisible = function(){return getResource(self._idR).visible};
		self.setVisible = function(avisible){getResource(self._idR).visible = avisible};
		self.getTrigger = function(){return getResource(self._idR).trigger};
		self.setTrigger = function(atrigger){getResource(self._idR).trigger = atrigger};
		self.getSource = function(){return getResource(self._idR).source};
		self.setSource = function(asource){getResource(self._idR).source = asource};
		self.getTransform = function(){return getResource(self._idR).transform};
		self.getColor = function(){return getResource(self._idR).color};
		self.isFlipX = function(){return getResource(self._idR).flipx};
		self.setFlipX = function(aflipx){getResource(self._idR).flipx = aflipx};
		self.isFlipY = function(){return getResource(self._idR).flipy};
		self.setFlipY = function(aflipy){getResource(self._idR).flipy = aflipy};
		self.isActive = function(){return getResource(self._idR).active};
		self.setActive = function(aactive){getResource(self._idR).active = aactive};
		self.getThumb = function(){return getResource(self._idR).bitmap};
		self.updateThumb = function(){
			getResource(self._idR).bitmap.setImage(self.getSource().getThumb());
			getResource(self._idR).bitmap.fillTint(self.getColor().toCode());
		}
	}
	function PAFFrame(anim){
		var self = this;
		var animation = anim;
		PAFResource.call(self, "PAFFrame");
		getResource(self._idR).actions = [];
		
		self.getAction = function(object){
			var actions = getResource(self._idR).actions;
			for(var a=0; a<actions.length; a++){
				if(actions[a].getObject()==object){
					return actions[a];
				}
			}
			return null;
		}
		self.createAction = function(object){
			var actions = getResource(self._idR).actions;
			var action = self.getAction(object);
			if(action){
				return action;
			}
			action = new PAFAction(object);
			actions.push(action);
			return action;
		}
		self.getTotalActions = function(){
			return getResource(self._idR).actions.length;
		}
		self.getAllActions = function(){
			var actions = getResource(self._idR).actions;
			var o_actions = [];
			for(var a=0; a<actions.length; a++){
				if(animation.hasIncludedObject(actions[a].getObject())){
					o_actions.push(actions[a]);
				}
			}
			return o_actions;
		}
		self.pasteAction = function(action, object=action.getObject()){
			var n_action = null;
			var actions = getResource(self._idR).actions;
			for(var a=0; a<actions.length; a++){
				if(actions[a].getObject()==object){
					n_action = actions[a];
					break;
				}
			}
			if(!n_action){
				n_action = new PAFAction(object);
				actions.push(n_action);
			}
			n_action.setVisible(action.isVisible());
			n_action.setTrigger(action.getTrigger());
			n_action.setSource(action.getSource());
			n_action.getTransform().set(action.getTransform());
			n_action.getColor().set(action.getColor());
			n_action.setActive(action.isActive());
			n_action.setFlipX(action.isFlipX());
			n_action.setFlipY(action.isFlipY());
			return action;
		}
		self.clearAllActions = function(){
			var actions = getResource(self._idR).actions;
			for(var a=0; a<actions.length; a++){
				actions[a]._removed = true;
				freeResource(actions[a]._idR);
			}
			getResource(self._idR).actions = [];
		}
		self.removeObjectAction = function(object){
			var actions = getResource(self._idR).actions;
			for(var a=0; a<actions.length; a++){
				if(actions[a].getObject()==object){
					freeResource(actions[a]._idR);
					actions.splice(a, 1);
					actions[a]._removed = true;
					a--;
				}
			}
		}
		self.paste = function(frame){
			var actions = frame.getAllActions();
			for(var a=0; a<actions.length; a++){
				self.pasteAction(actions[a]);
			}
		}
	}
	function PAFAnimation(aname=""){
		var self = this;
		PAFResource.call(self, "PAFAnimation");
		getResource(self._idR).name = aname;
		getResource(self._idR).incobjs = [];
		getResource(self._idR).frames = [];
		
		function replicateObjectAction(obj, frame, lframe){
			var laction = null;
			var action = frame.getAction(obj);
			if(lframe){
				laction = lframe.getAction(obj);
			}
			if(action==null){
				if(lframe==null){
					action = frame.createAction(obj);
				}
				else{
					action = frame.pasteAction(laction, obj);
					action.setActive(false);
				}
			}
		}
		
		function fixFrameLacks(index, sobj=null){
			var frames = getResource(self._idR).frames;
			var frame = frames[index];
			var lframe = index>0?frames[index-1]:null;
			
			if(sobj){
				replicateObjectAction(sobj, frame, lframe);
			}
			else{
				for(var oi=0; oi<getResource(self._idR).incobjs.length; oi++){
					replicateObjectAction(getResource(self._idR).incobjs[oi], frame, lframe);
				}
			}
		}
		
		self.getName = function(){return getResource(self._idR).name};
		self.setName = function(aname){self._owner.renameAnimation(self._idR, aname)};
		self.getIncludedObjects = function(){
			var incobjs = getResource(self._idR).incobjs;
			var o_incobjs = [];
			for(var oi=0; oi<incobjs.length; oi++){
				o_incobjs.push(incobjs[oi]);
			}
			return o_incobjs;
		}
		self.moveIncludedObject = function(obj, offset){
			var incobjs = getResource(self._idR).incobjs;
			if(incobjs.includes(obj)){
				var index = incobjs.indexOf(obj);
				incobjs.splice(index, 1);
				incobjs.splice(offset < 0? 0: offset, 0, obj);
				return incobjs.indexOf(obj);
			}
			return -1;
		}
		self.indexOfIncludedObject = function(obj){
			var incobjs = getResource(self._idR).incobjs;
			return incobjs.indexOf(obj);
		}
		self.getNotIncludedObjects = function(){
			var incobjs = getResource(self._idR).incobjs;
			var o_nincobjs = [];
			for(var oi=0; oi<objects.length; oi++){
				if(!incobjs.includes(objects[oi])){
					o_nincobjs.push(objects[oi]);
				}
			}
			return o_nincobjs;
		}
		self.includeObject = function(obj){
			if(!getResource(self._idR).incobjs.includes(obj)){
				getResource(self._idR).incobjs.push(obj);
				var id = obj._idR;
				
				var frames = getResource(self._idR).frames;
				for(var fi=0; fi<frames.length; fi++){
					fixFrameLacks(fi, obj);
				}
			}
		}
		self.unincludeObject = function(obj){
			if(getResource(self._idR).incobjs.indexOf(obj) >= 0){
				getResource(self._idR).incobjs.splice(getResource(self._idR).incobjs.indexOf(obj), 1);
			}
		}
		self.hasIncludedObject = function(obj){
			return getResource(self._idR).incobjs.includes(obj);
		}
		self.getFrame = function(i){return getResource(self._idR).frames[i];}
		self.getAllFrames = function(){
			var frames = getResource(self._idR).frames;
			var o_frames = [];
			for(var f=0; f<frames.length; f++){
				o_frames.push(frames[f]);
			}
			return o_frames;
		}
		self.getTotalFrames = function(){return getResource(self._idR).frames.length;}
		self.addFrame = function(index=-1){
			var frame = new PAFFrame(self);
			index = index < 0 || index >= getResource(self._idR).frames.length? getResource(self._idR).frames.length: index;
			getResource(self._idR).frames.splice(index, 0, frame);
			fixFrameLacks(index);
			return frame;
		}
		self.moveFrame = function(index, dest, ammount=1){
			var frames = getResource(self._idR).frames;
			var mframes = frames.splice(index, ammount);
			if(dest>index){
				dest -= ammount;
			}
			while(mframes.length>0){
				frames.splice(dest, 0, mframes.pop());
			}
		}
		self.removeFrame = function(index=-1){
			if(index < 0){
				getResource(self._idR).frames[self.getTotalFrames()-1].clearAllActions();
				freeResource(getResource(self._idR).frames[self.getTotalFrames()-1]._idR);
				getResource(self._idR).frames[self.getTotalFrames()-1]._removed = true;
				getResource(self._idR).frames.pop();
			}
			else if(index < self.getTotalFrames()){
				getResource(self._idR).frames[index].clearAllActions();
				freeResource(getResource(self._idR).frames[index]._idR);
				getResource(self._idR).frames[index]._removed = true;
				getResource(self._idR).frames.splice(index, 1);
			}
		}
		self.removeAllFrames = function(){
			var frames = getResource(self._idR).frames;
			for(var f=0; f<frames.length; f++){
				getResource(self._idR).frames[f].clearAllActions();
				freeResource(getResource(self._idR).frames[f]._idR);
				getResource(self._idR).frames[f]._removed = true;
			}
			getResource(self._idR).frames = [];
		}
		self.removeObject = function(object){
			var frames = getResource(self._idR).frames;
			for(var f=0; f<frames.length; f++){
				frames[f].removeObjectAction(object);
			}
			self.unincludeObject(object);
		}
	}
	
	// Internal Functions
	function updateSourcesThumbByImage(image){
		for(var i=0; i<sources.length; i++){
			if(sources[i].getImage()==image){
				sources[i].updateThumb();
			}
		}
	}
	function updateObjectsThumbBySource(source){
		for(var i=0; i<objects.length; i++){
			if(objects[i].getSource()==source){
				objects[i].updateThumb();
			}
		}
	}
	_project.renameAnimation = function(id, name){
		for(var ai=0; ai<animations.length; ai++){
			if(animations[ai]._idR!=id && animations[ai].getName()==name){
				throw new Error("Trying to set name of animation to '"+name+"' when has already another animation with the same name!");
			}
		}
		getResource(id).name = name;
	}
	_project.refreshThumbs = function(){
		
	}
	// Do a cleanup in all animations to avoid references to any non-existent object
	_project.cleanup = function(){
		for(var a=0; a<animations.length; a++){
			var anim = animations[a];
			var frames = anim.getAllFrames();
			var inc = anim.getIncludedObjects();
			
			// Every object must be catalloged, otherwise, will be removed for security reasons
			for(var i=0; i<inc.length; i++){
				if(!objects.includes(inc[i])){
					anim.removeObject(inc[i]);
				}
			}
			
			for(var f=0; f<frames.length; f++){
				var actions = frames[f].getAllActions();
				
				for(var a=0; a<actions.length; a++){
					if(!objects.includes(actions[a].getObject()) || !anim.hasIncludedObject(actions[a].getObject())){
						frames[f].removeObjectAction(actions[a].getObject());
					}
				}
			}
		}
	}
	
	
	// Modular Functions
	// Creating resources
	_project.createImage = function(name="", bitmap=(new BitmapImage())){
		var image = new PAFImage(name, bitmap);
		images.push(image);
		return image;
	}
	_project.createSource = function(image, rect){
		if(image instanceof PAFImage){
			var source = new PAFSource(image, rect);
			sources.push(source);
			return source;
		}
		else{
			throw new Error("You must supply a PAFImage instance!");
		}
	}
	_project.createObject = function(source, name="", origin){
		if(source instanceof PAFSource){
			var object = new PAFObject(source, name, origin);
			objects.push(object);
			return object;
		}
		else{
			throw new Error("You must supply a PAFSource instance!");
		}
	}
	_project.createAnimation = function(name=""){
		if(_project.hasAnimationWithName(name)){
			throw new Error("Trying to set name of animation to '"+name+"' when has already another animation with the same name!");
		}
		var animation = new PAFAnimation(genID());
		_project.renameAnimation(animation._idR, name);
		animations.push(animation);
		return animation;
	}
	
	
	// Duplicate resource
	_project.duplicateImage = function(image, name){
		var nimage = _project.createImage(name, new BitmapImage(image.getThumb()));
		_project.moveImage(nimage, _project.indexOfImage(image)+1);
		return nimage;
	}
	_project.duplicateSource = function(source){
		var nsource = _project.createSource(source.getImage(), (new Rect()).set(source.getRect()));
		_project.moveSource(nsource, _project.indexOfSource(source)+1);
		return nsource;
	}
	_project.duplicateObject = function(object, name){
		var nobject = _project.createObject(object.getSource(), name, (new Vector2()).set(object.getOrigin()));
		_project.moveObject(nobject, _project.indexOfObject(object)+1);
		return nobject;
	}
	_project.duplicateAnimation = function(animation, name){
		var nanimation = _project.createAnimation(name);
		for(var f=0; f<animation.getTotalFrames(); f++){
			var frame = animation.getFrame(f);
			var nframe = nanimation.addFrame();
			
			var actions = frame.getAllActions();
			for(var a=0; a<actions.length; a++){
				nframe.pasteAction(actions[a]);
			}
		}
		var inc = animation.getIncludedObjects();
		for(var i=0; i<inc.length; i++){
			nanimation.includeObject(inc[i]);
		}
		_project.moveAnimation(nanimation, _project.indexOfAnimation(animation)+1);
		return nanimation;
	}
	
	
	// Querying ammount resources
	_project.getTotalImages = function(){
		return images.length;
	}
	_project.getTotalSources = function(){
		return sources.length;
	}
	_project.getTotalObjects = function(){
		return objects.length;
	}
	_project.getTotalAnimations = function(){
		return animations.length;
	}
	
	
	// Querying all resources
	_project.getAllImages = function(){
		var o_images = [];
		for(var i=0; i<images.length; i++){
			o_images.push(images[i]);
		}
		return o_images;
	}
	_project.getAllSources = function(){
		var o_sources = [];
		for(var i=0; i<sources.length; i++){
			o_sources.push(sources[i]);
		}
		return o_sources;
	}
	_project.getAllObjects = function(){
		var o_objects = [];
		for(var i=0; i<objects.length; i++){
			o_objects.push(objects[i]);
		}
		return o_objects;
	}
	_project.getAllAnimations = function(){
		var o_animations = [];
		for(var i=0; i<animations.length; i++){
			o_animations.push(animations[i]);
		}
		return o_animations;
	}
	
	// Querying specific resource
	_project.getImage = function(index){
		return images[index];
	}
	_project.getSource = function(index){
		return sources[index];
	}
	_project.getObject = function(index){
		return objects[index];
	}
	_project.getAnimation = function(index){
		return animations[index];
	}
	
	// Querying resources by name
	_project.getAllImagesByName = function(name){
		var o_images = [];
		for(var i=0; i<images.length; i++){
			if(images[i].getName()==name){
				o_images.push(images[i]);
			}
		}
		return o_images;
	}
	_project.getAllObjectsByName = function(name){
		var o_objects = [];
		for(var i=0; i<objects.length; i++){
			if(objects[i].getName()==name){
				o_objects.push(objects[i]);
			}
		}
		return o_objects;
	}
	_project.getAnimationByName = function(name){
		for(var i=0; i<animations.length; i++){
			if(animations[i].getName()==name){
				return animations[i];
			}
		}
	}
	
	
	// Querying resources by references
	_project.getAllSourcesByImage = function(image){
		var o_sources = [];
		for(var i=0; i<sources.length; i++){
			if(sources[i].getImage()==image){
				o_sources.push(sources[i]);
			}
		}
		return o_sources;
	}
	_project.getAllObjectsBySource = function(source){
		var o_objects = [];
		for(var i=0; i<objects.length; i++){
			if(objects[i].getImage()==image){
				o_objects.push(objects[i]);
			}
		}
		return o_objects;
	}
	
	// Querying index from resource
	_project.indexOfImage = function(image){
		return images.indexOf(image);
	}
	_project.indexOfSource = function(source){
		return sources.indexOf(source);
	}
	_project.indexOfObject = function(object){
		return objects.indexOf(object);
	}
	_project.indexOfAnimation = function(animation){
		return animations.indexOf(animation);
	}
	
	
	// Remove Functions
	_project.removeImage = function(image){
		for(var si=0; si<sources.length; si++){
			if(sources[si].getImage()==image){
				_project.removeSource(sources[si]);
				si--;
			}
		}
		for(var i=0; i<images.length; i++){
			if(images[i]==image){
				freeResource(image._idR);
				images.splice(i, 1);
				return;
			}
		}
		image._removed = true;
	}
	_project.removeSource = function(source){
		for(var oi=0; oi<objects.length; oi++){
			if(objects[oi].getSource()==source){
				_project.removeObject(objects[oi]);
				oi--;
			}
		}
		for(var i=0; i<animations.length; i++){
			var frames = animations[i].getAllFrames();
			for(var f=0; f<frames.length; f++){
				var actions = frames[f].getAllActions();
				for(var a=0; a<actions.length; a++){
					if(actions[a].getSource()==source){
						if(f==0){
							actions[a].setSource(actions[a].getObject().getSource());
						}
						else{
							actions[a].setSource(actions[a-1].getSource());
						}
					}
				}
			}
		}
		for(var si=0; si<sources.length; si++){
			if(sources[si]==source){
				freeResource(source._idR);
				sources.splice(si, 1);
				return;
			}
		}
		source._removed = true;
	}
	_project.removeObject = function(object){
		for(var i=0; i<animations.length; i++){
			animations[i].removeObject(object);
		}
		for(var oi=0; oi<objects.length; oi++){
			if(objects[oi]==object){
				freeResource(object._idR);
				objects.splice(oi, 1);
				return;
			}
		}
		object._removed = true;
	}
	_project.removeAnimation = function(animation){
		for(var i=0; i<animations.length; i++){
			if(animations[i]==animation){
				animation.removeAllFrames();
				freeResource(animation._idR);
				animations.splice(i, 1);
				i--;
				return;
			}
		}
		animation._removed = true;
	}
	
	
	// Utilities Functions
	self.moveImage = function(image, offset=images.length-1){
		var index = images.indexOf(image);
		images.splice(index, 1);
		//index += offset;
		images.splice(offset, 0, image);
		return images.indexOf(image);
	}
	self.moveSource = function(source, offset=source.length-1){
		var index = sources.indexOf(source);
		sources.splice(index, 1);
		//index += offset;
		sources.splice(offset, 0, source);
		return sources.indexOf(source);
	}
	self.moveObject = function(object, offset=objects.length-1){
		var index = objects.indexOf(object);
		objects.splice(index, 1);
		//index += offset;
		objects.splice(offset, 0, object);
		return objects.indexOf(object);
	}
	self.moveAnimation = function(animation, offset=animations.length-1){
		var index = animations.indexOf(animation);
		animations.splice(index, 1);
		//index += offset;
		animations.splice(offset, 0, animation);
		return animations.indexOf(animation);
	}
	
	
	// Guides and checks
	_project.hasImageWithName = function(name){
		for(var i=0; i<images.length; i++){
			if(images[i].getName()==name){
				return true;
			}
		}
		return false;
	}
	_project.hasObjectWithName = function(name){
		for(var i=0; i<objects.length; i++){
			if(objects[i].getName()==name){
				return true;
			}
		}
		return false;
	}
	_project.hasAnimationWithName = function(name){
		for(var i=0; i<animations.length; i++){
			if(animations[i].getName()==name){
				return true;
			}
		}
		return false;
	}
	
	
	// DEBUG Function
	_project._getResources = function(){
		return _resources;
	}
	
}
