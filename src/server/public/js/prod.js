var API_GET="http://localhost:5000/colors",bgImg=document.querySelector("#imgc");bgImg.parentElement.hidden=!0;var img=new Image;img.onload=function(e){console.log(e),console.log(img.naturalWidth,img.naturalHeight),bgImg.style.width=""+img.naturalWidth,bgImg.style.height=""+img.naturalHeight,bgImg.parentElement.hidden=!1},img.src="/image/infile.jpg";var fetch_css=function(){var e=document.createElement("link");e.rel="stylesheet",e.type="text/css",e.href="/colorcss/infile.jpg/style.css",document.head.appendChild(e)};fetch_css();