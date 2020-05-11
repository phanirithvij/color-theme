const API_GET : string = "http://localhost:5000/colors";

type RGB = [number, number, number];

interface colorData {
    main    : RGB;
    palette : RGB[];
};

const bgImg : HTMLDivElement = document.querySelector('#imgc');
bgImg.parentElement.hidden = true;
const imgx : HTMLImageElement = new Image();
imgx.onload = (ev)=>{
    console.log(ev);
    console.log(imgx.naturalWidth, imgx.naturalHeight);
    // bgImg.appendChild(img);
    bgImg.style.width = `${imgx.naturalWidth}`;
    bgImg.style.height = `${imgx.naturalHeight}`;
    bgImg.parentElement.hidden = false;

    // console.log(ev.target);

    let ColorCube = window['ColorCube'] || null;    
    console.log((new ColorCube).get_colors(document.querySelector('#img-main')))
};
const filename = "one.jpg"
imgx.src = `/image/${filename}`;

const fetch_css = ()=>{
    const css = document.createElement('link');
    css.rel = "stylesheet";
    css.type = "text/css";
    css.href = `/colorcss/${filename}/style.css`;
    document.head.appendChild(css);
}

fetch_css();

fetch(`${API_GET}/${filename}/data.json`, {
    method : "GET",
    headers: {
        "Content-Type": "application/json",
    }
})
.then(s=>s.json())
.then((a:colorData)=>{
    // console.log(a);
    const bg : RGB = a.main;
    const palette : RGB[] = a.palette;
    console.log(bg, palette);
    // const html : HTMLHtmlElement = document.querySelector(':root');
    // html.style.setProperty('--bg-color', `rgb(${bg[0]},${bg[1]},${bg[2]})`);
    // palette.forEach((color : RGB, i: number)=> {
    //     html.style.setProperty(`--color-${i}`, `rgb(${color[0]},${color[1]},${color[2]})`);            
    // });

    console.log("a small update")
});

/* A naive Pseudo-Ecrypting image names on frontend can be done using */

/*
// by sending
    btoa(btoa('filename'))
// to the server instead of filename
// like an id but not uuid

// and decode on server side (python)
import base64
data = from_client()
once = base64.b64decode(data).decode('utf-8')
twice= base64.b64decode(once).decode('utf-8')
print(twice == "filename")
*/
