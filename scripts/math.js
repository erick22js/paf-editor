
function Vector2(x=0, y=0){
	var self = this;
	self.x = x;
	self.y = y;
	
	self.clone = function(){
		return new Vector2(self.x, self.y);
	}
	self.set = function(v, y=null){
		if(y==null){
			self.x = v.x;
			self.y = v.y;
		}
		else{
			self.x = v;
			self.y = y;
		}
		return self;
	}
	self.distance = function(){
		return Math.sqrt(self.x**2 + self.y**2);
	}
	self.distanceTo = function(v, y=null){
		if(y==null){
			return Math.sqrt((v.x-self.x)**2 + (v.y-self.y)**2);
		}
		else{
			return Math.sqrt((v-self.x)**2 + (y-self.y)**2);
		}
	}
	self.angle = function(){
		return Math.atan2(self.y, self.x);
	}
	self.angleTo = function(v, y=null){
		if(y==null){
			return Math.atan2(v.y-self.y, v.x-self.x);
		}
		else{
			return Math.atan2(y-self.y, v-self.x);
		}
	}
	self.normalize = function(){
		var dist = Math.sqrt(self.x**2 + self.y**2);
		self.x /= dist;
		self.y /= dist;
		return self;
	}
	self.add = function(v, y=null){
		if(y==null){
			self.x += v.x;
			self.y += v.y;
		}
		else{
			self.x += v;
			self.y += y;
		}
		return self;
	}
	self.sub = function(v, y=null){
		if(y==null){
			self.x -= v.x;
			self.y -= v.y;
		}
		else{
			self.x -= v;
			self.y -= y;
		}
		return self;
	}
	self.mul = function(v, y=null){
		if(y==null){
			self.x *= v.x;
			self.y *= v.y;
		}
		else{
			self.x *= v;
			self.y *= y;
		}
		return self;
	}
	self.scale = function(v){
		self.x *= v;
		self.y *= v;
		return self;
	}
	self.div = function(v, y=null){
		if(y==null){
			self.x /= v.x;
			self.y /= v.y;
		}
		else{
			self.x /= v;
			self.y /= y;
		}
		return self;
	}
	self.downscale = function(v){
		self.x /= v;
		self.y /= v;
		return self;
	}
	self.rotate = function(rad){
		return self.transform((new Matrix3x2()).setToRotation(rad));
	}
	self.transform = function(m){
		var vx = self.x*m.a + self.y*m.c + m.x;
		var vy = self.x*m.b + self.y*m.d + m.y;
		self.x = vx;
		self.y = vy;
		return self;
	}
	self.untransform = function(m){
		return self.transform(m.getInverse())
	}
	
	self.toString = function(){
		return "Vector2("+self.x+", "+self.y+")";
	}
}

function Rect(x=0, y=0, w=0, h=0){
	var self = this;
	self.x = x;
	self.y = y;
	self.w = w;
	self.h = h;
	
	self.clone = function(){
		return new Rect(self.x, self.y, self.w, self.h);
	}
	self.set = function(r, y=null, w=null, h=null){
		if(y==null){
			self.x = r.x;
			self.y = r.y;
			self.w = r.w;
			self.h = r.h;
		}
		else{
			self.x = r;
			self.y = y;
			seld.w = w;
			self.h = h;
		}
		return self;
	}
	self.getTranslation = function(v, y=null){
		if(y==null){
			self.x = v.x;
			self.y = v.y;
		}
		else{
			self.x = v;
			self.y = y;
		}
		return self;
	}
	self.setTranslation = function(){
		return new Vector2(self.x, self.y);
	}
	self.setSize = function(v, h=null){
		if(y==null){
			self.w = v.x;
			self.h = v.y;
		}
		else{
			self.w = v;
			self.h = h;
		}
		return self;
	}
	self.getSize = function(){
		return new Vector2(self.w, self.h);
	}
	self.isPointInside = function(v, y=null){
		if(y==null){
			return v.x>=self.x && v.x<=self.x+self.w && v.y>=self.y && v.y<=self.y+self.h;
		}
		else{
			return v>=self.x && v<=self.x+self.w && y>=self.y && y<=self.y+self.h;
		}
	}
	
	self.toString = function(){
		return "Rect("+self.x+", "+self.y+", "+self.w+", "+self.h+")";
	}
}

function Matrix3x2(a=1, b=0, c=0, d=1, x=0, y=0){
	var self = this;
	self.a = a;
	self.b = b;
	self.c = c;
	self.d = d;
	self.x = x;
	self.y = y;
	
	self.clone = function(){
		return new Matrix3x2(self.a, self.b, self.c, self.d, self.x, self.y);
	}
	function det2(a, b, c, d){
		return a*d - b*c;
	}
	self.getInverse = function(){
		var det = self.a*self.d - self.b*self.c;
		var m = new Matrix3x2(self.d/det, -self.b/det, -self.c/det, self.a/det, 0, 0);
		var iv = self.getTranslation().transform(m).scale(-1);
		m.setTranslation(iv);
		return m;
	}
	self.set = function(m, b=null, c=null, d=null, x=null, y=null){
		if(b==null){
			self.a = m.a;
			self.b = m.b;
			self.c = m.c;
			self.d = m.d;
			self.x = m.x;
			self.y = m.y;
		}
		else{
			self.a = m;
			self.b = b;
			self.c = c;
			self.d = d;
			self.x = x;
			self.y = y;
		}
		return self;
	}
	self.setTranslation = function(v, y=null){
		if(y==null){
			self.x = v.x;
			self.y = v.y;
		}
		else{
			self.x = v;
			self.y = y;
		}
		return self;
	}
	self.getTranslation = function(){
		return new Vector2(self.x, self.y);
	}
	self.setScale = function(v, y=null){
		if(y==null){
			self.a = v.x;
			self.d = v.y;
		}
		else{
			self.a = v;
			self.d = y;
		}
		return self;
	}
	self.getScale = function(){
		return new Vector2(self.a, self.d);
	}
	self.setSkew = function(v, y=null){
		if(y==null){
			self.c = v.x;
			self.b = v.y;
		}
		else{
			self.c = v;
			self.b = y;
		}
		return self;
	}
	self.getSkew = function(){
		return new Vector2(self.c, self.b);
	}
	self.setToRotation = function(rad){
		self.a = Math.cos(rad);
		self.b = -Math.sin(rad);
		self.c = Math.sin(rad);
		self.d = Math.cos(rad);
		return self;
	}
	self.getRotationByX = function(){
		return Math.atan2(self.b, self.a);
	}
	self.getRotationByY = function(){
		return Math.atan2(self.c, self.d);
	}
	self.mul = function(m){
		var va = self.a*m.a + self.b*m.c;
		var vb = self.a*m.b + self.b*m.d;
		var vc = self.c*m.a + self.d*m.c;
		var vd = self.c*m.b + self.d*m.d;
		var vx = self.x*m.a + self.y*m.c + m.x;
		var vy = self.x*m.b + self.y*m.d + m.y;
		self.a = va;
		self.b = vb;
		self.c = vc;
		self.d = vd;
		self.x = vx;
		self.y = vy;
		return self;
	}
	self.translate = function(v, y=null){
		if(y==null){
			self.x += v.x;
			self.y += v.y;
		}
		else{
			self.x += v;
			self.y += y;
		}
		return self;
	}
	self.scale = function(v, y=null){
		return self.mul((new Matrix3x2()).setScale(v, y));
	}
	self.skew = function(v, y=null){
		return self.mul((new Matrix3x2()).setSkew(v, y));
	}
	self.rotate = function(rad){
		return self.mul((new Matrix3x2()).setToRotation(rad));
	}
	
	self.toString = function(rad){
		return "Matrix3x2("+self.a+","+self.b+", "+self.c+", "+self.d+", "+self.x+", "+self.y+")";
	}
}

function Color(r=1, g=1, b=1, a=1){
	var self = this;
	self.r = r;
	self.g = g;
	self.b = b;
	self.a = a;
	
	self.set = function(c, g=null, b=null, a=null){
		if(g==null){
			self.r = c.r;
			self.g = c.g;
			self.b = c.b;
			self.a = c.a;
		}
		else{
			self.r = c;
			self.g = g;
			self.b = b;
			self.a = a;
		}
	}
	self.setCode = function(code, ignore_alpha=true){
		self.r = parseInt(code.substr(1, 2), 16)/255;
		self.g = parseInt(code.substr(3, 2), 16)/255;
		self.b = parseInt(code.substr(5, 2), 16)/255;
		if(!ignore_alpha){
			self.a = parseInt(code.substr(5, 2), 16)/255;
			self.a = isNaN(self.a)? 1: self.a;
		}
	}
	self.toCode = function(ignore_alpha=true){
		var vr = (~~(self.r*255));
		var vg = (~~(self.g*255));
		var vb = (~~(self.b*255));
		var va = (~~(self.a*255));
		return '#'+(vr<16?'0':'')+vr.toString(16)+(vg<16?'0':'')+vg.toString(16)+(vb<16?'0':'')+vb.toString(16)+
			(ignore_alpha?'':(va<16?'0':'')+va.toString(16));
	}
}

function radToDeg(rad){
	return (rad/Math.PI)*180;
}

function degToRad(deg){
	return (deg/180)*Math.PI;
}
