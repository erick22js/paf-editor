
var _bibuffer = document.createElement("canvas");
var _bictx = _bibuffer.getContext("2d");

function BitmapImage(data=null, onload=function(img){}, _extra=null){
	var self = this;
	var canvas = null;
	var ctx = null;
	
	var dirt = true;
	var base64 = "";
	
	self.width = 0;
	self.height = 0;
	
	// Decode data to components info
	if(data instanceof HTMLCanvasElement){
		canvas = document.createElement("canvas");
		self.width = canvas.width = data.width;
		self.height = canvas.height = data.height;
		ctx = canvas.getContext("2d");
		ctx.drawImage(data, 0, 0);
		onload(self, _extra);
	}
	else if(data instanceof CanvasRenderingContext2D){
		canvas = document.createElement("canvas");
		self.width = canvas.width = data.canvas.width;
		self.height = canvas.height = data.canvas.height;
		ctx = canvas.getContext("2d");
		ctx.drawImage(data.canvas, 0, 0);
		onload(self, _extra);
	}
	else if(data instanceof BitmapImage){
		canvas = document.createElement("canvas");
		self.width = canvas.width = data.getCanvas().width;
		self.height = canvas.height = data.getCanvas().height;
		ctx = canvas.getContext("2d");
		ctx.drawImage(data.getCanvas(), 0, 0);
		onload(self, _extra);
	}
	else if(typeof(data)=="string"){
		canvas = document.createElement("canvas");
		var img = new Image();
		img.src = data;
		img.onload = function(){
			base64 = data;
			dirt = false;
			self.width = canvas.width = img.width;
			self.height = canvas.height = img.height;
			ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0);
			onload(self, _extra);
		}
	}
	else{
		canvas = document.createElement("canvas");
		self.width = canvas.width = 1;
		self.height = canvas.height = 1;
		ctx = canvas.getContext("2d");
		onload(self, _extra);
	}
	
	// UTILITIES Functions
	self.hookCanvas = function(cv, onload=(function(){})){
		canvas = cv;
		ctx = canvas.getContext("2d");
		onload(self, _extra);
		dirt = true;
		return self;
	}
	self.getWidth = function(){
		return canvas.width;
	}
	self.getHeight = function(){
		return canvas.height;
	}
	self.setImage = function(img, x=0, y=0, w=img.width, h=img.height, sx=0, sy=0, sw=img.width, sh=img.height){
		self.width = canvas.width = w;
		self.height = canvas.height = h;
		self.clearRect();
		self.drawImageSrc(img, sx, sy, sw, sh, x, y, w, h);
		dirt = true;
	}
	self.fillTint = function(color){
		_bibuffer.width = canvas.width;
		_bibuffer.height = canvas.height;
		_bictx.clearRect(0, 0, canvas.width, canvas.height);
		_bictx.fillStyle = color;
		_bictx.fillRect(0, 0, canvas.width, canvas.height);
		_bictx.globalCompositeOperation = "destination-in";
		_bictx.drawImage(canvas, 0, 0);
		_bictx.globalCompositeOperation = "multiply";
		_bictx.drawImage(canvas, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(_bibuffer, 0, 0);
		dirt = true;
	}
	
	// DRAWING Functions
	self.arc = function(x=0, y=0, radius=1, startAngle=0, endAngle=2*Math.PI, nonclockwise=false){
		ctx.arc(x, y, radius, startAngle, endAngle, nonclockwise);
		dirt = true;
	}
	self.arcTo = function(x1=0, y1=0, x2=0, y2=0, radius=0){
		ctx.arcTo(x1, y1, x2, y2, radius);
		dirt = true;
	}
	self.beginPath = function(){
		ctx.beginPath();
		dirt = true;
	}
	self.bezierCurveTo = function(cx1=0, cy1=0, cx2=0, cy2=0, x=0, y=0){
		ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
		dirt = true;
	}
	self.clearRect = function(x=0, y=0, w=self.getWidth(), h=self.getHeight()){
		ctx.clearRect(x, y, w, h);
		dirt = true;
	}
	self.closePath = function(){
		ctx.closePath();
		dirt = true;
	}
	self.drawImage = function(img, x=0, y=0, w=img.width, h=img.height){
		if(img instanceof ImageData){
			ctx.putImageData(img, x, y, w, h);
		}
		else if(img instanceof BitmapImage){
			ctx.drawImage(img.getCanvas(), x, y, w, h);
		}
		else{
			ctx.drawImage(img, x, y, w, h);
		}
		dirt = true;
	}
	self.drawImageSrc = function(img, sx=0, sy=0, sw=img.width, sh=img.height, x=0, y=0, w=img.width, h=img.height){
		if(img instanceof ImageData){
			ctx.putImageData(img, sx, sy, sw, sh, x, y, w, h);
		}
		else if(img instanceof BitmapImage){
			ctx.drawImage(img.getCanvas(), sx, sy, sw, sh, x, y, w, h);	
		}
		else{
			ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
		}
		dirt = true;
	}
	self.ellipse = function(x, y, radius_x, radius_y, rotation, start_angle, end_angle){
		ctx.ellipse(x, y, radius_x, radius_y, rotation, start_angle, end_angle);
		dirt = true;
	}
	self.fill = function(){
		ctx.fill();
		dirt = true;
	}
	self.fillText = function(text, x, y){
		ctx.fillText(text, x, y);
		dirt = true;
	}
	self.fillRect = function(x=0, y=0, w=self.getWidth(), h=self.getHeight()){
		ctx.fillRect(x, y, w, h);
		dirt = true;
	}
	self.fillCircle = function(x, y, radius){
		ctx.save();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI*2);
		ctx.fill();
		ctx.closePath();
		ctx.restore();
		dirt = true;
	}
	self.lineTo = function(x, y){
		ctx.lineTo(x, y);
		dirt = true;
	}
	self.measureText = function(text){
		dirt = true;
		return ctx.measureText(text);
	}
	self.moveTo = function(x, y){
		ctx.moveTo(x, y);
		dirt = true;
	}
	self.quadraticCurveTo = function(cx, cy, x, y){
		ctx.quadraticCurveTo(cx, cy, x, y);
		dirt = true;
	}
	self.rect = function(x, y, w, h){
		ctx.rect(x, y, w, h);
		dirt = true;
	}
	self.setAlpha = function(alpha){
		ctx.globalAlpha = alpha;
	}
	self.setCompositeOperation = function(fx){
		ctx.globalCompositeOperation = fx;
	}
	self.setFillStyle = function(style){
		ctx.fillStyle = style;
	}
	self.setFont = function(size=10, family="serif", weight=""){
		ctx.font = weight+" "+size+"px "+family;
	}
	self.setLetterSpacing = function(px){
		ctx.letterSpacing = px;
	}
	self.setLineWidth = function(width){
		ctx.lineWidth = width;
	}
	self.setShadowBlur = function(size){
		ctx.shadowBlur = size;
	}
	self.setShadowColor = function(color){
		ctx.shadowColor = color;
	}
	self.setShadowOffsetX = function(position){
		ctx.shadowOffsetX = position;
	}
	self.setShadowOffsetY = function(position){
		ctx.shadowOffsetY = position;
	}
	self.setStrokeStyle = function(style){
		ctx.strokeStyle = style;
	}
	self.strokeLine = function(x1, y1, x2, y2){
		ctx.save();
		ctx.closePath();
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
		dirt = true;
	}
	self.strokeRect = function(x=0, y=0, w=1, h=1){
		ctx.strokeRect(x, y, w, h);
		dirt = true;
	}
	self.roundRect = function(x, y, w, h, radius){
		ctx.roundRect(x, y, w, h, radius);
		dirt = true;
	}
	self.setLineDash = function(pattern){
		ctx.setLineDash(pattern);
		dirt = true;
	}
	self.stroke = function(){
		ctx.stroke();
		dirt = true;
	}
	
	// MATRIX Transformations
	self.pushMatrix = function(){
		ctx.save();
	}
	self.setMatrix = function(m=1, b=0, c=0, d=1, x=0, y=0){
		ctx.resetTransform();
		if(m instanceof Matrix3x2){
			ctx.transform(m.a, m.b, m.c, m.d, m.x, m.y);
		}
		else{
			ctx.transform(m, b, c, d, x, y);
		}
	}
	self.getMatrix = function(){
		var transform = ctx.getTransform();
		return new Matrix3x2(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
	}
	self.transform = function(a=1, b=0, c=0, d=1, x=0, y=0){
		ctx.transform(a, b, c, d, x, y);
	}
	self.mulMatrix = function(m){
		ctx.transform(m.a, m.b, m.c, m.d, m.x, m.y);
	}
	self.translate = function(x, y){
		ctx.translate(x, y);
	}
	self.scale = function(x, y){
		ctx.scale(x, y);
	}
	self.rotate = function(rad){
		ctx.rotate(rad);
	}
	self.popMatrix = function(){
		ctx.restore();
	}
	
	// TOOL Functions
	self.toDataURI = function(spec=undefined, quality=undefined){
		if(dirt){
			base64 = canvas.toDataURL(spec, quality);
			dirt = false;
		}
		return base64;
	}
	self.getCanvas = function(){
		return canvas;
	}
	self.getImageData = function(x=0, y=0, w=canvas.width, h=canvas.height){
		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}
	self.crop = function(x=0, y=0, w=canvas.width, h=canvas.height){
		ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
		self.width = canvas.width = w;
		self.height = canvas.height = h;
		dirt = true;
	}
	self.resize = function(w=canvas.width, h=canvas.height){
		ctx.drawImage(canvas, 0, 0, w, h);
		self.width = canvas.width = w;
		self.height = canvas.height = h;
		dirt = true;
	}
}
