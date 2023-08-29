

function pafpReproduceAnimation(proj, name, canvas, options={}){
	if(proj.hasAnimationWithName(name)){
		var anim = proj.getAnimationByName(name);
		var f = 0;
		canvas.width = canvas.getBoundingClientRect().width;
		canvas.height = canvas.getBoundingClientRect().height;
		var bmp = (new BitmapImage()).hookCanvas(canvas);
		
		var bbmp = new BitmapImage();
		
		function frameanim(){
			bmp.pushMatrix();
			
			bmp.clearRect();
			bmp.translate(bmp.getWidth()/2, bmp.getHeight()/2);
			
			//console.log(f);
			var frame = anim.getFrame(f);
			var inc = anim.getIncludedObjects();
			
			for(var i=0; i<inc.length; i++){
				var obj = inc[i];
				var action = frame.getAction(obj);
				bmp.pushMatrix();
				bmp.mulMatrix(action.getTransform());
				
				if(action.isVisible()){
					var flipx = action.isFlipX()?-1:1;
					var flipy = action.isFlipY()?-1:1;
					bmp.scale(flipx, flipy);
					bmp.setAlpha(action.getColor().a);
					bbmp.setImage(action.getSource().getImage().getBitmap());
					bbmp.fillTint(action.getColor().toCode());
					var rect = action.getSource().getRect();
					bmp.drawImageSrc(bbmp, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w*flipx, rect.h*flipy);
					bmp.setAlpha(1);
				}
				
				var trigger = action.getTrigger();
				if(trigger!=null && trigger!=''){
					console.log(trigger);
				}
				
				bmp.popMatrix();
			}
			
			f = (f + 1)%anim.getTotalFrames();
			
			bmp.popMatrix();
		}
		return setInterval(frameanim, 1000/proj.fps);
	}
	return null;
}

function pafpStopReproduction(reproduction){
	clearInterval(reproduction);
}
