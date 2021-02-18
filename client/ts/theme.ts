const API_GET: string = "http://localhost:5000/colors";

type ColorItem = {
  exact: boolean[];
  hex: string;
  names: string[];
  similar_colors: string[];
  vibrant_color?: string;
  count?: number;
};

interface colorData {
  main: ColorItem;
  file: string;
  palette: ColorItem[];
  vibrant_palette: ColorItem[];
  node_vibrant: ColorItem[];
  cube: ColorItem[];
  rgbaster: ColorItem[];
  service: ColorItem[];
  get_colors: ColorItem[];
}

const bgImg: HTMLDivElement = document.querySelector("#imgc");
bgImg.parentElement.hidden = true;
const imgx: HTMLImageElement = new Image();
imgx.onload = (ev) => {
  console.log(ev);
  console.log(imgx.naturalWidth, imgx.naturalHeight);
  // bgImg.appendChild(img);
  bgImg.style.width = `${imgx.naturalWidth}`;
  bgImg.style.height = `${imgx.naturalHeight}`;
  bgImg.parentElement.hidden = false;

  // console.log(ev.target);
};
declare var imagefile: string;
const filename = imagefile;
// imgx.src = filename;
imgx.src = `/tus_upload/${filename}`;

const fetch_css = () => {
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.type = "text/css";
  css.href = `/colorcss/${filename}/style.css`;
  document.head.appendChild(css);
};

fetch_css();

declare var styledConsoleLog: any;
declare var invertColor: any;
declare var altInvertColor: any;
declare var addPalete: any;
declare var getContrast: any;

var jsonData : colorData;

fetch(`${API_GET}/${filename}/data.json`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((s) => s.json())
  .then((a: colorData) => {
    // console.log(a);
    jsonData = a;
    const bg: ColorItem = a.main;
    const palette: ColorItem[] = a.palette;
    const vibrant_palette: ColorItem[] = a.vibrant_palette;
    const node_vibrant: ColorItem[] = a.node_vibrant;
    const cube: ColorItem[] = a.cube;
    const rgbaster: ColorItem[] = a.rgbaster;
    const service: ColorItem[] = a.service;
    const get_colors: ColorItem[] = a.get_colors;

    console.log(jsonData.main);
    const x: HTMLDivElement = document.querySelector('#content');
    x.style.color = getContrast(bg.hex);

    var out = "";
    var txt = "";
    palette.forEach((p) => {
      txt = `<span style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">         </span>`;
      out += txt;
    });

    styledConsoleLog(out);

    out = "";
    palette.forEach((p) => {
      txt = `<div style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">${p.names}</div>`;
      out += txt;
    });
    addPalete("#pal1", out);

    var out = "";
    var txt = "";
    vibrant_palette.forEach((p) => {
      txt = `<span style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">         </span>`;
      out += txt;
    });

    styledConsoleLog(out);
    out = "";
    vibrant_palette.forEach((p) => {
      txt = `<div style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };"> ${p.names} </div>`;
      out += txt;
    });
    addPalete("#pal2", out);

    var out = "";
    var txt = "";
    node_vibrant.forEach((p) => {
      txt = `<span style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">         </span>`;
      out += txt;
    });

    styledConsoleLog(out);
    out = "";
    node_vibrant.forEach((p) => {
      txt = `<div style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };"> ${p.names} </div>`;
      out += txt;
    });
    addPalete("#pal3", out);

    var out = "";
    var txt = "";
    cube.forEach((p) => {
      txt = `<span style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">         </span>`;
      // ${p.names}
      out += txt;
    });

    styledConsoleLog(out);
    out = "";
    cube.forEach((p) => {
      txt = `<div style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">${p.names}</div>`;
      out += txt;
    });
    addPalete("#pal4", out);

    var out = "";
    var txt = "";
    rgbaster.forEach((p) => {
      txt = `<span style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">         </span>`;
      // ${p.names}
      out += txt;
    });

    styledConsoleLog(out);
    out = "";
    rgbaster.forEach((p) => {
      txt = `<div style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">${p.names}</div>`;
      out += txt;
    });
    addPalete("#pal5", out);

    var out = "";
    var txt = "";
    service.forEach((p) => {
      txt = `<span style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">         </span>`;
      // ${p.names}
      out += txt;
    });

    styledConsoleLog(out);
    out = "";
    service.forEach((p) => {
      txt = `<div style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">${p.names}</div>`;
      out += txt;
    });
    addPalete("#pal6", out);

    var out = "";
    var txt = "";
    get_colors.forEach((p) => {
      txt = `<span style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">         </span>`;
      // ${p.names}
      out += txt;
    });

    styledConsoleLog(out);
    out = "";
    get_colors.forEach((p) => {
      txt = `<div style="color:${getContrast(p.hex)};background-color:${
        p.hex
      };">${p.names}</div>`;
      out += txt;
    });
    addPalete("#pal7", out);

    // const html : HTMLHtmlElement = document.querySelector(':root');
    // html.style.setProperty('--bg-color', `rgb(${bg[0]},${bg[1]},${bg[2]})`);
    // palette.forEach((color : RGB, i: number)=> {
    //     html.style.setProperty(`--color-${i}`, `rgb(${color[0]},${color[1]},${color[2]})`);
    // });

    // console.log("a small update");
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

// var shouldBreak = false;
// for (var r = 0; r < 256; r++) {
//   if (shouldBreak) break;
//   for (var g = 0; g < 256; g++) {
//     if (shouldBreak) break;
//     for (var b = 0; b < 256; b++) {
//       if (shouldBreak) break;
//       if (invertColorRGB(r, g, b) != getContrastRGB(r, g, b)) {
//         console.log("no", r, g, b);
//         shouldBreak = true;
//       }
//     }
//   }
// }
