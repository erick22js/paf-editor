
const File = (new function(){
	var self = this;
	self.WRITE = 1;
	self.READ = 2;
	self.READ_WRITE = 2;
	
	self.LITTLE_ENDIAN = 10;
	self.BIG_ENDIAN = 11;
	
	self.EOF = -1;
	
	function create(fstream, ftype, fseek=0){
		return (new (function(fstream, ftype, fseek){
			var self = this;
			var stream = fstream;
			self.mode = File.LITTLE_ENDIAN;
			self.fixed = true;
			var type = ftype;
			var seek = fseek;
			
			self.name = "";
			
			var buff = new Uint8Array(8);
			var fbuff = new Float32Array(buff.buffer);
			
			self.toString = function(){
				var str = "";
				for(var i=0; i<stream.length; i++){
					str += String.fromCharCode(stream[i]);
				}
				return str;
			}
			
			self.toBinary = function(offset=0, length=(stream.length-offset)){
				var nstream = stream.slice(offset, offset+length);
				return new Uint8Array(nstream);
			}
			
			self.get = function(){
				if(seek >= stream.length){
					return File.EOF;
				}
				var v = stream[seek];
				seek++;
				return v&0xFF;
			}
			
			self.getc = function(){
				if(!self.eof()){
					var chr = self.get();
					if(chr!=0){
						return ''+String.fromCharCode(chr);
					}
				}
				return '';
			}
			
			self.put = function(v){
				if(!self.fixed){
					if(seek >= stream.length){
						for(var i=stream.length; i<seek; i++){
							stream[seek] = 0;
						}
					}
					stream[seek] = v&0xFF;
					seek++;
				}
				else{
					if(seek >= stream.length){
						return;
					}
					stream[seek] = v&0xFF;
					seek++;
				}
			}
			
			self.putc = function(chr){
				self.put((''+chr).charCodeAt(0) || 0);
			}
			
			self.unpug = function(){
				seek--;
			}
			
			self.read8 = function(){
				return self.get();
			}
			
			self.readS8 = function(){
				var v = self.read8();
				if(v&0x80){
					return v-0x100;
				}
				return v;
			}
			
			self.write8 = function(v){
				self.put(v);
			}
			
			self.read16 = function(){
				if(self.mode==File.LITTLE_ENDIAN){
					return (self.read8()) | (self.read8()<<8);
				}
				else{
					return (self.read8()<<8) | (self.read8());
				}
			}
			
			self.readS16 = function(){
				var v = self.read16();
				if(v&0x8000){
					return v-0x10000;
				}
				return v;
			}
			
			self.write16 = function(v){
				if(self.mode==File.LITTLE_ENDIAN){
					self.put((v) & 0xFF);
					self.put((v>>8) & 0xFF);
				}
				else{
					self.put((v>>8) & 0xFF);
					self.put((v) & 0xFF);
				}
			}
			
			self.readS32 = function(){
				if(self.mode==File.LITTLE_ENDIAN){
					return (self.read8()) | (self.read8()<<8) | (self.read8()<<16) | ((self.read8()<<24)>>>0);
				}
				else{
					return (((self.read8()<<24)>>>0) | ((self.read8()<<16) | (self.read8()<<8) | (self.read8())))>>>0;
				}
			}
			
			self.read32 = self.readS32;
			
			self.write32 = function(v){
				if(self.mode==File.LITTLE_ENDIAN){
					self.put((v>>>0) & 0xFF);
					self.put((v>>>8) & 0xFF);
					self.put((v>>>16) & 0xFF);
					self.put((v>>>24) & 0xFF);
				}
				else{
					self.put((v>>>24) & 0xFF);
					self.put((v>>>16) & 0xFF);
					self.put((v>>>8) & 0xFF);
					self.put((v>>>0) & 0xFF);
				}
			}
			
			self.readFloat32 = function(v){
				if(self.mode==File.LITTLE_ENDIAN){
					buff[0] = self.read8();
					buff[1] = self.read8();
					buff[2] = self.read8();
					buff[3] = self.read8();
				}
				else{
					buff[3] = self.read8();
					buff[2] = self.read8();
					buff[1] = self.read8();
					buff[0] = self.read8();
				}
				return fbuff[0];
			}
			
			self.writeFloat32 = function(v){
				fbuff[0] = v;
				if(self.mode==File.LITTLE_ENDIAN){
					self.write8(buff[0]);
					self.write8(buff[1]);
					self.write8(buff[2]);
					self.write8(buff[3]);
				}
				else{
					self.write8(buff[3]);
					self.write8(buff[2]);
					self.write8(buff[1]);
					self.write8(buff[0]);
				}
			}
			
			self.readString = function(limit=-1){
				var string = "";
				if(limit>=0){
					var chr;
					while(limit>0){
						chr = self.getc();
						string += chr;
						limit--;
					}
					return string;
				}
				else{
					var chr = self.getc();
					while(chr!=''){
						string += chr;
						chr = self.getc();
					}
				}
				return string;
			}
			
			self.writeString = function(str){
				for(var i=0; i<str.length; i++){
					self.putc(str.charAt(i));
				}
			}
			
			self.eof = function(){
				return seek >= stream.length;
			}
			
			self.seekSet = function(offset){
				seek = offset;
			}
			
			self.seekCur = function(offset){
				seek += offset;
			}
			
			self.seekEnd = function(offset){
				seek = stream.length + offset;
			}
			
			self.size = function(){
				return stream.length;
			}
			
			self.tell = function(){
				return seek;
			}
			
			self.saveAsText = function(){
				var blob, url;
				blob = new Blob([self.toString()], {
					type: 'text/plain-text'
				});
				url = window.URL.createObjectURL(blob);
				var a = document.createElement("a");
				a.href = url;
				a.download = self.name;
				document.body.appendChild(a);
				a.click();
				a.remove();
			}
			
			self.saveAsBinary = function(){
				var blob, url;
				blob = new Blob([new Uint8Array(stream)], {
					type: 'application/octet-stream'
				});
				url = window.URL.createObjectURL(blob);
				var a = document.createElement("a");
				a.href = url;
				a.download = self.name;
				document.body.appendChild(a);
				a.click();
				a.remove();
			}
		})(fstream, ftype, fseek));
	}
	
	self.openString = function(str){
		var stream = [];
		for(var i=0; i<str.length; i++){
			stream.push((str.charCodeAt(i))&0xFF);
		}
		return create(stream, self.READ_WRITE, 0);
	}
	
	self.openBuffer = function(buff){
		var stream = [];
		for(var i=0; i<buff.length; i++){
			stream.push((Number(buff[i]) || 0)&0xFF);
		}
		return create(stream, self.READ_WRITE, 0);
	}
	
	function pickFile(func="readAsArrayBuffer", data_callback=function(datas){}, multiple=false, pick_callback=function(total, names, files){}){
		var fe = document.createElement("input");
		fe.type = "file";
		if(multiple){
			fe.multiple = 'multiple';
		}
		fe.onchange = function(v){
			fe.remove();
			var names = [];
			var datas = [];
			var dict = {};
			var count = v.target.files.length;
			
			for(var i=0; i<v.target.files.length; i++){
				var file = v.target.files[i];
				var reader = new FileReader();
				let file_name = file.name;
				
				reader.onload = function(e) {
					if(!dict[file_name]){
						dict[file_name] = e.target.result;
						datas.push(e.target.result);
						names.push(file_name);
						count--;
						
						if(count <= 0){
							data_callback(datas, names);
						}
					}
				};
				reader.onerror = function(e) {
					console.log('Error: ' + e.type);
				};
				reader[func](file);
			}
			pick_callback(v.target.files.length, names, v.target.files);
		}
		fe.click();
	}
	
	self.pickText = function(callback=function(files){}, multiple=false){
		pickFile("readAsText", function(datas, names){
			var files = [];
			for(var d=0; d<datas.length; d++){
				var stream = [];
				for(var i=0; i<datas[d].length; i++){
					stream.push((datas[d].charCodeAt(i))&0xFF);
				}
				var file = create(stream, self.READ_WRITE, 0);
				file.name = names[d];
				files.push(file);
			}
			callback(files);
		}, multiple, function(total, names){});
	}
	
	self.pickBuffer = function(callback=function(files){}, multiple=false){
		pickFile("readAsArrayBuffer", function(datas, names){
			var files = [];
			for(var d=0; d<datas.length; d++){
				var stream = [];
				datas[d] = new Uint8Array(datas[d]);
				for(var i=0; i<datas[d].length; i++){
					stream.push((Number(datas[d][i]) || 0)&0xFF);
				}
				var file = create(stream, self.READ_WRITE, 0);
				file.name = names[d];
				files.push(file);
			}
			callback(files);
		}, multiple, function(total, names){});
	}
	
	self.pickURI = function(callback=function(uris, names){}, multiple=false){
		pickFile("readAsDataURL", function(datas, names){
			var uris = [];
			for(var d=0; d<datas.length; d++){
				uris.push(datas[d]);
			}
			callback(uris, names);
		}, multiple, function(total, names){});
	}
	
	self.saveUri = function(name, uri){
		var a = document.createElement("a");
		a.href = uri;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		a.remove();
	}
});
