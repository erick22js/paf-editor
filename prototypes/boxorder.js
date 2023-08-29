
function boCreate(atlas_width, atlas_height){
	var bo = {};
	bo.atlas = [];
	bo.info = {
		"top": 0,
		"bottom": 0,
		"left": 0,
		"awid": atlas_width,
		"ahei": atlas_height
	};
	return bo;
}

function boAddBox(bo, w, h, id){
	while(true){
		var heit = bo.info.ahei - bo.info.top;
		var heib = bo.info.ahei - bo.info.bottom;
		var heid = bo.info.bottom - bo.info.top;
		var wid = bo.info.awid - bo.info.left;
		
		// Base verifications
		if(h > heit){
			return false;
		}
		if(w < wid){
			bo.atlas.push({
				"id": id,
				"x": bo.info.left,
				"y": bo.info.top,
				"w": w,
				"h": h,
			});
			bo.info.left += w;
			if(h > heid){
				bo.info.bottom = bo.info.top + h;
			}
			return true;
		}
		bo.info.top = bo.info.bottom;
		bo.info.left = 0;
	}
	return false;
}


function bbCreate(max_width, max_height){
	var bb = {};
	bb.info = {
		"mwid": max_width,
		"mhei": max_height
	};
	bb.boxes = [];
	return bb;
}

function bbAddBox(bb, wid, hei, id){
	var box = {
		"id": id,
		"width": wid, "height": hei,
	};
	bb.boxes.push(box);
}

function bbFitBoxes(bb){
	var boxes = /*bb.boxes || */bb.boxes.sort(function(e1, e2){
		return e2.height*e2.width - e1.height*e1.width;
	});
	var corners = [{
		"left": 0, "top": 0,
		"width": bb.info.mwid,
		"height": bb.info.mhei
	}];
	bb.corners = corners;
	var non_fits = 0;
	for(var b=0; b<boxes.length; b++){
		var box = boxes[b];
		var corner;
		var fit = false;
		cornerloop: for(var c=0; c<corners.length; c++){
			corner = corners[c];
			if(box.width <= corner.width && 
				box.height <= corner.height){
				fit = true;
				box.x = corner.left;
				box.y = corner.top;
				corners.splice(c, 1);
				for(var k=0; k<corners.length; k++){
					var korner = corners[k];
					if(corner==korner){
						continue;
					}
					if((korner.left < box.x+box.width) && (korner.left+korner.width > box.x)){
						if((box.y >= korner.top) && (box.y < korner.top+korner.height)){
							korner.height = box.y-korner.top;
						}
					}
					if((korner.top < box.y+box.height) && (korner.top+korner.height > box.y)){
						if((box.x >= korner.left) && (box.x < korner.left+korner.width)){
							korner.width = box.x-korner.left;
						}
					}
				}
				corners.push({
					"left": corner.left, "top": corner.top + box.height,
					"width": corner.width,
					"height": corner.height - box.height
				});
				corners.push({
					"left": corner.left + box.width, "top": corner.top,
					"width": corner.width - box.width,
					"height": corner.height
				});
				break cornerloop;
			}
		}
		if(!fit){
			non_fits++;
		}
	}
	return non_fits;
}