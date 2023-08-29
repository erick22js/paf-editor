
//
//	OVERRIDE BEHAVIORS
//

document.body.pool_oncontextmenu = [];
document.body.oncontextmenu = function(ev){
	// Idea for a setting click
	/*
	if(_ldropdownopened){
		_ldropdownopened.remove();
		_ldropdownopened = null;
	}
	*/
	for(var i=0; i<document.body.pool_oncontextmenu.length; i++){
		document.body.pool_oncontextmenu[i](ev);
	}
	return false;
}

document.body.pool_onmousedown = [];
document.body.onmousedown = function(ev){
	for(var i=0; i<document.body.pool_onmousedown.length; i++){
		document.body.pool_onmousedown[i](ev);
	}
}

window.onmouseup = function(){
	setTimeout(function(){
		if(_ldropdownopened){
			if(_ldropdownopened._WARN){
				_ldropdownopened.remove();
				_ldropdownopened = null;
			}
			else{
				_ldropdownopened._WARN = true;
			}
		}
	}, 1);
}

document.body.pool_onmouseup = [];
document.body.onmouseup = function(ev){
	for(var i=0; i<document.body.pool_onmouseup.length; i++){
		document.body.pool_onmouseup[i](ev);
	}
}

document.body.pool_onmousemove = [];
document.body.onmousemove = function(ev){
	for(var i=0; i<document.body.pool_onmousemove.length; i++){
		document.body.pool_onmousemove[i](ev);
	}
}

const Input = {
	"ctrlKey": false
}

document.body.onkeydown = function(ev){
	if(ev.key=='Control'){
		Input.ctrlKey = true;
	}
	if(ev.ctrlKey && (ev.key=='z'|| ev.key=='Z' || ev.key=='y'|| ev.key=='Y')){
		ev.preventDefault();
		return false;
	}
}

document.body.onkeyup = function(ev){
	if(ev.key=='Control'){
		Input.ctrlKey = false;
	}
}

HTMLElement.prototype.removeAllChildren = function(){
	while(this.firstChild){
		this.removeChild(this.lastChild);
	}
}

function uiCreateResourceItemElement(options={}){
	var item = document.createElement("div");
	item.className = "resource-item";
	item.title = options.name||"";
	item.options = options;
	
	if(options.selected){
		item.style.backgroundColor = "#66A";
	}
	
	item.onmousedown = function(ev){
		if(ev.button==0){
			if(options.onlclick){
				options.onlclick(this);
			}
		}
		else if(ev.button==2){
			if(options.onrclick){
				options.onrclick(this);
			}
		}
	}
	
	item.style.userSelect = "none";
	
	// Drop icon
	{
		var panel = document.createElement("div");
		panel.style.width = "7%";
		panel.style.overflow = "hidden";
		panel.style.display = "flex";
		panel.style.alignItems = "center";
		panel.style.justifyContent = "center";
		item.appendChild(panel);
		
		var arrow = document.createElement("div");
		if(options.mode=="file"){
			arrow.hidden = "hidden";
		}
		else{
			arrow.style.width = "0";
			arrow.style.height = "0";
			if(options.open){
				arrow.style.borderTop = "0.4em solid #AAA";
				arrow.style.borderLeft = "0.4em solid transparent";
				arrow.style.borderRight = "0.4em solid transparent";
			}
			else{
				arrow.style.borderLeft = "0.4em solid #AAA";
				arrow.style.borderTop = "0.4em solid transparent";
				arrow.style.borderBottom = "0.4em solid transparent";
			}
		}
		panel.appendChild(arrow);
	}
	// Resource icon
	{
		var panel = document.createElement("div");
		panel.style.width = "15%";
		panel.style.overflow = "hidden";
		panel.style.display = "flex";
		panel.style.alignItems = "center";
		panel.style.justifyContent = "center";
		item.appendChild(panel);
		
		var icon = document.createElement("img");
		if(options.icon){
			icon.src = options.icon;
		}
		else{
			icon.src = "icon/folder.png";
			if(options.mode=="file"){
				switch(options.type){
					case "image":{
						icon.src = "icon/image.png";
					}
					break;
					case "source":{
						icon.src = "icon/frame.png";
					}
					break;
					case "object":{
						icon.src = "icon/object.png";
					}
					break;
					case "animation":{
						icon.src = "icon/animation.png";
					}
					break;
				}
			}
		}
		icon.style.width = "100%";
		icon.style.height = "100%";
		icon.style.objectFit = "contain";
		panel.appendChild(icon);
	}
	// Resource name
	{
		var panel = document.createElement("div");
		panel.style.width = "78%";
		panel.style.overflow = "hidden";
		panel.style.display = "flex";
		panel.style.alignItems = "center";
		item.appendChild(panel);
		
		var name = document.createElement("text");
		name.style.paddingLeft = ".5em";
		name.style.wordBreak = "break-all";
		name.style.textOverflow = "ellipsis";
		name.style.maxHeight = "1.3em";
		name.style.overflow = "hidden";
		name.textContent = options.name||"";
		panel.appendChild(name);
	}
	return item;
}

var _ldropdownopened = null;
var _evdropdownadded = false;
function uiCreateDropdown(target, options){
	var dropdown = document.createElement("div");
	dropdown.__target = target;
	dropdown.options = options;
	
	if(_ldropdownopened && _ldropdownopened.__target==target){
		_ldropdownopened.remove();
		_ldropdownopened = null;
		return;
	}
	
	if(_ldropdownopened){
		_ldropdownopened.remove();
	}
	
	if(target instanceof HTMLElement){
		var target_bbox = target.getBoundingClientRect();
		dropdown.style.left = target_bbox.x+"px";
		dropdown.style.top = (target_bbox.y + target_bbox.height)+"px";
		dropdown.style.minWidth = target_bbox.width+"px";
	}
	else{
		dropdown.style.left = target.x+"px";
		dropdown.style.top = target.y+"px";
		dropdown.style.minWidth = target.width+"px";
	}
	
	dropdown.className = "dropdown";
	dropdown.style.position = "absolute";
	
	for(var opi=0; opi<options.length; opi++){
		var opt = options[opi];
		var option = document.createElement("div");
		option.opt = opt;
		option.index = opi;
		if(opt.icon){
			var icon = document.createElement("img");
			icon.src = opt.icon;
			//icon.style.border = "1px solid black";
			icon.style.marginRight = "5pt";
			icon.style.height = "100%";
			icon.style.width = "25pt";
			icon.style.objectFit = "contain";
			option.appendChild(icon);
		}
		if(opt.name){
			var label = document.createElement("text");
			label.textContent = opt.name;
			//label.style.border = "1px solid black";
			label.style.height = "100%";
			label.style.display = "flex";
			label.style.alignItems = "center";
			option.appendChild(label);
		}
		option.onclick = function(){
			if(this.opt.click){
				this.opt.click(this.opt, this);
			}
			_ldropdownopened = null;
			dropdown.remove();
		}
		dropdown.appendChild(option);
	}
	
	var onClickOutside = function(event){
		if(_ldropdownopened){
			if(!_ldropdownopened.contains(event.target)){
				//_ldropdownopened.remove();
				//_ldropdownopened = null;
			}
		}
	}
	if(!_evdropdownadded){
		document.body.addEventListener('mousedown', onClickOutside);
		_evdropdownadded = true;
	}
	document.body.appendChild(dropdown);
	dropdown.style.top = "min(99.5vh - "+(~~dropdown.getBoundingClientRect().height)+"px, "+dropdown.style.top+")";
	_ldropdownopened = dropdown;
}

window.addEventListener('keydown', function(ev){
	if(ev.key=='Escape' && _ldropdownopened){
		_ldropdownopened.remove();
		_ldropdownopened = null;
	}
});
