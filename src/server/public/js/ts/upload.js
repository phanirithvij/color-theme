"use strict";exports.__esModule=!0,document.addEventListener("DOMContentLoaded",fn,!1);var Uppy=require("@uppy/core"),Dashboard=require("@uppy/dashboard"),Tus=require("@uppy/tus");console.log("Uppy loaded");var uppy=Uppy({onBeforeUpload:function(e){for(var n=0,t=Object.entries(e);n<t.length;n++){var o=t[n],u=o[0],o=o[1];console.log(u,o)}return!0}});function fn(){uppy.use(Dashboard,{inline:!0,fileManagerSelectionType:"both",target:".upload-box"}).use(Tus,{endpoint:"/upload_resumable"});var t={};var e=io.connect("http://"+document.domain+":"+location.port+"/events");e.on("connect",function(){e.emit("status",{status:"I'm connected!"})}),e.on("userid",function(e){e.userid}),e.on("updatestatus",function(e){var n=100*e.current/e.total;t[e.elementid].go(n),console.log(e,"updateprogess"),"DONE"==e.status&&(n=document.getElementById(e.elementid).parentElement,(e=document.createElement("a")).href="/view?img=filename",e.text="open image",n.appendChild(e))}),e.on("status",function(e){console.log(e,"status")}),e.on("disconnect",function(e){console.log(e,"dead server")})}window.uppy=uppy;