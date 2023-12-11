
//
//	SETUP
//

var workspace = new PAFWorkspace();
var proj = workspace.getProject();


//
//	EVENTS OCURRENCES
//

hotbar_file.addEventListener('click', function(ev){
	uiCreateDropdown(hotbar_file, [
		{
			"name": "New Project",
			"click": function(){
				workspace.newProject();
				proj = workspace.getProject();
			}
		},
		{
			"name": "Load Project",
			"click": function(){
				File.pickText(function(files){
					workspace.newProject();
					proj = workspace.getProject();
					pafLoadProject(proj, files[0]);
				});
			}
		},
		{
			"name": "Save Project",
			"click": function(){
				pafSaveProject(proj);
			}
		},
		{
			"name": "Import PAF",
			"click": function(){
				File.pickBuffer(function(files){
					workspace.newProject();
					proj = workspace.getProject();
					PAFImport.import(proj, files[0]);
					workspace.updateFace();
				});
			}
		},
		{
			"name": "Export PAF",
			"click": function(){
				PAFImport.export(proj);
			}
		},
		{
			"name": "Import PAF (old)",
			"click": function(){
				File.pickBuffer(function(files){
					workspace.newProject();
					proj = workspace.getProject();
					PAFImport.importOld(proj, files[0]);
					workspace.updateFace();
				});
			}
		},
		{
			"name": "Import PAM with ATLAS",
			"click": function(){
				File.pickBuffer(function(files){
					function extension(path){
						return path.split('.').pop().toLowerCase();
					}
					
					var file_pam = null;
					var file_atlas = null;
					
					for(var f=0; f<files.length; f++){
						if(extension(files[f].name)=='pam'){
							file_pam = files[f];
						}
						if(extension(files[f].name)=='json'){
							file_atlas = files[f];
						}
					}
					
					if(file_pam==null){
						alert("You Must select a PAM File!");
						return;
					}
					if(file_atlas==null){
						alert("You Must select a atlas JSON File!");
						return;
					}
					
					workspace.newProject();
					proj = workspace.getProject();
					pamToPaf(proj, pamDecode(file_pam), JSON.parse(file_atlas.toString()));
					workspace.updateFace();
					
				}, true);
			}
		},
		{
			"name": "Import REANIM",
			"click": function(){
				workspace.newProject();
				proj = workspace.getProject();
				File.pickBuffer(function(files){
					reanimToPaf(proj, reanimDecode(files[0]));
					workspace.updateFace();
				}, false);
			}
		}
	]);
	//ev.stopPropagation();
});

hotbar_project.addEventListener('click', function(ev){
	uiCreateDropdown(hotbar_project, [
		{
			"name": "FPS",
			"click": function(){
				proj.fps = Number(prompt("Insert the FPS target for animations:", proj.fps))||proj.fps;
			}
		},
		{
			"name": "Version",
			"click": function(){
				proj.project_version = Number(prompt("Insert the version of project:", proj.project_version))||proj.project_version;
			}
		},
		{
			"name": "Grid",
			"click": function(){
				proj.grid = Number(prompt("Insert the size of grid:", proj.grid))||0;
			}
		},
	]);
})

hotbar_tools.addEventListener('click', function(ev){
	uiCreateDropdown(hotbar_tools, [
		{
			"name": "Execute File...",
			"click": function(){
				File.pickText(function(files){
					for(var i=0; i<files.length; i++){
						console.log("Running \""+files[i].name+"\"...");
						eval(files[i].toString());
					}
				}, true);
			}
		},
		{
			"name": "Command",
			"click": function(){
				eval(prompt("Type below your JavaScript command:"));
			}
		},
		{
			"name": "Optmize Project",
			"click": function(){
				if(confirm("Do you really want to optmize the project? This may affect all actions, and possibly cause some artifacts on animations.")){
					pafOptimize(proj);
					workspace.updateFace();
				}
			}
		},
		{
			"name": "Remove Unuseds",
			"click": function(){
				if(confirm("Do you want to remove all unused resources in project?")){
					pafRemoveUnused(proj);
					workspace.updateFace();
				}
			}
		},
		{
			"name": "Pack Images",
			"click": function(){
				if(confirm("Do you wanna pack every image in project? All images will be turned into single one.")){
					pafPackImages(proj);
					workspace.updateFace();
				}
			}
		},
		{
			"name": "Split Images",
			"click": function(){
				if(confirm("Do you wanna split the images in project? This will be done using the sources rect.")){
					pafUnpackImages(proj);
					workspace.updateFace();
				}
			}
		},
		{
			"name": "Global Transform",
			"click": function(){
				var x_translation = Number(prompt("Inform the X translation:", 0))||0;
				var y_translation = Number(prompt("Inform the Y translation:", 0))||0;
				var x_scale = Number(prompt("Inform the scale:", 1))||1;
				var y_scale = x_scale;
				pafGlobalTransform(proj, x_translation, y_translation, x_scale, y_scale);
				workspace.updateFace();
			}
		},
		{
			"name": "REANIM Auto Import Images",
			"click": function(){
				// Request for extra files to be assigned to images
				File.pickURI(function(uris, names){
					for(var i=0; i<names.length; i++){
						var name = "IMAGE_REANIM_"+names[i].slice(0, names[i].lastIndexOf('.')).toUpperCase();
						//console.log("Testing for file "+names[i]);
						
						var imgs = proj.getAllImages();
						for(var m=0; m<imgs.length; m++){
							if(imgs[m].getName()==(name)){
								(new BitmapImage(uris[i], function(img, image){
									image.setBitmap(img);
									
									var srcs = proj.getAllSources();
									for(var s=0; s<srcs.length; s++){
										if(srcs[s].getImage()==image){
											srcs[s].getRect().x = 0;
											srcs[s].getRect().y = 0;
											srcs[s].getRect().w = img.getWidth();
											srcs[s].getRect().h = img.getHeight();
											srcs[s].updateThumb();
										}
									}
									
									workspace.updateFace();
								}, imgs[m]))
								break;
							}
						}
					}
				}, true);
			}
		}
	]);
	//ev.stopPropagation();
})

hotbar_help.addEventListener('click', function(ev){
	uiCreateDropdown(hotbar_help, [
		{
			"name": "Documentation",
			"click": function(){
				var a = document.createElement("a");
				a.href = "ext/docs.html";
				a.target = "_blank";
				a.click();
				a.remove();
			}
		},
		{
			"name": "How to Use",
			"click": function(){
				var a = document.createElement("a");
				a.href = "ext/howto.html";
				a.target = "_blank";
				a.click();
				a.remove();
			}
		},
		{
			"name": "About",
			"click": function(){
				alert("Made by Erick S. Oliveira, aka, Clehpton :-)");
			}
		},
	]);
	//ev.stopPropagation();
})


//
//	DEBUG TESTS
//
workspace.uiUpdateResourcesList()
