function fn(){var c="",e=document.querySelector("button"),r=document.querySelector("input");e.onclick=function(){n()};var a,n=function(){var e=r.files,n=new FormData;n.append("file",e[0]),n.append("userid",a),c=e[0].name;var t=function(e){var n=e+u++,t=document.createElement("div");return t.id=n,document.querySelector("#progress").appendChild(t),n}("progress");n.append("elementid",t);var o=new Nanobar({bg:"#44f",target:document.getElementById(t)});d[t]=o,fetch("/upload",{method:"POST",body:n}).then(function(e){return e.json()}).then(function(e){console.log(e)}).catch(function(e){console.error(e)})},u=0,d={};var t=io.connect("http://"+document.domain+":"+location.port+"/events");t.on("connect",function(){t.emit("status",{status:"I'm connected!"})}),t.on("userid",function(e){a=e.userid}),t.on("celerystatus",function(e){var n=100*e.current/e.total;if(d[e.elementid].go(n),console.log(e,"updateprogess"),"DONE"==e.status){var t=document.getElementById(e.elementid).parentElement,o=document.createElement("a");o.href="/?img="+c,o.text="open image",t.appendChild(o)}}),t.on("status",function(e){console.log(e,"status")}),t.on("disconnect",function(e){console.log(e,"dead server")})}document.addEventListener("DOMContentLoaded",fn,!1);