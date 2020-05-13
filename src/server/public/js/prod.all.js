/*
Copyright (c) 2015, Ole Krause-Sparmann,
                    Andrew Monks <a@monks.co>
Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted, provided that the
above copyright notice and this permission notice appear in all
copies.
THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR
PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
*/

/*
ColorCube Class

  Uses a 3d RGB histogram to find local maximas in the density distribution
  in order to retrieve dominant colors of pixel images
*/
function ColorCube(resolution = 20,
    bright_threshold = 0.2,
    distinct_threshold = 0.4) {

    // subclasses   // // // // // // // // // // // // // // // // // // // //
    // // // // // // // // // // // // // // // // // // // // // // // // //

    /*
    CanvasImage Class

    Class that wraps the html image element and canvas.
    It also simplifies some of the canvas context manipulation
    with a set of helper functions.

    modified from Color Thief v2.0
    by Lokesh Dhakar - http://www.lokeshdhakar.com
    */
    let CanvasImage = function (image) {

        if (!image instanceof HTMLElement) {
            throw "You've gotta use an html image element as ur input!!";
        }

        let API = {};

        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');

        // document.body.appendChild(canvas);

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0, image.width, image.height);

        API.getImageData = () => {
            return context.getImageData(0, 0, image.width, image.height);
        };

        return API;
    };




    /*
    CubeCell Class

    class that represents one voxel within rgb colorspace
    */
    function CubeCell() {
        let API = {};

        // Count of hits
        // (dividing the accumulators by this value gives the average color)
        API.hit_count = 0;

        // accumulators for color components
        API.r_acc = 0.0;
        API.g_acc = 0.0;
        API.b_acc = 0.0;

        return API;
    }




    /*
    LocalMaximum Class

    Local maxima as found during the image analysis.
    We need this class for ordering by cell hit count.
    */
    function LocalMaximum(hit_count, cell_index, r, g, b) {
        let API = {};

        // hit count of the cell
        API.hit_count = hit_count;

        // linear index of the cell
        API.cell_index = cell_index;

        // average color of the cell
        API.r = r;
        API.g = g;
        API.b = b;

        return API;
    }





    // ColorCube    // // // // // // // // // // // // // // // // // // // //
    // // // // // // // // // // // // // // // // // // // // // // // // //




    let API = {};

    // helper variable to have cell count handy
    let cell_count = resolution * resolution * resolution;

    // create cells
    let cells = [];
    for (let i = 0; i <= cell_count; i++) {
        cells.push(new CubeCell());
    }

    // indices for neighbor cells in three dimensional grid
    let neighbour_indices = [
        [0, 0, 0],
        [0, 0, 1],
        [0, 0, -1],

        [0, 1, 0],
        [0, 1, 1],
        [0, 1, -1],

        [0, -1, 0],
        [0, -1, 1],
        [0, -1, -1],

        [1, 0, 0],
        [1, 0, 1],
        [1, 0, -1],

        [1, 1, 0],
        [1, 1, 1],
        [1, 1, -1],

        [1, -1, 0],
        [1, -1, 1],
        [1, -1, -1],

        [-1, 0, 0],
        [-1, 0, 1],
        [-1, 0, -1],

        [-1, 1, 0],
        [-1, 1, 1],
        [-1, 1, -1],

        [-1, -1, 0],
        [-1, -1, 1],
        [-1, -1, -1]
    ];

    // returns linear index for cell with given 3d index
    let cell_index = (r, g, b) => {
        return (r + g * resolution + b * resolution * resolution);
    };

    let clear_cells = () => {
        for (let cell of cells) {
            cell.hit_count = 0;
            cell.r_acc = 0;
            cell.g_acc = 0;
            cell.b_acc = 0;
        }
    };

    API.get_colors = (image) => {
        let canvasimage = new CanvasImage(image);

        let m = find_local_maxima(canvasimage);

        m = filter_distinct_maxima(m);

        let colors = [];
        for (let n of m) {
            let r = Math.round(n.r * 255.0);
            let g = Math.round(n.g * 255.0);
            let b = Math.round(n.b * 255.0);
            let color = rgbToHex(r, g, b);
            if (color === "#NaNNaNNaN") {
                continue;
            }
            colors.push(color);
        }

        return colors;
    };

    let componentToHex = (c) => {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    };

    let rgbToHex = (r, g, b) => {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    };

    // finds and returns local maxima in 3d histogram, sorted by hit count
    let find_local_maxima = (image) => {
        // reset all cells
        clear_cells();

        // get the image pixels
        let data = image.getImageData().data;

        // iterate over all pixels of the image
        for (let i = 0; i < data.length; i += 4) {
            // get color components
            let red = data[i] / 255.0;
            let green = data[i + 1] / 255.0;
            let blue = data[i + 2] / 255.0;
            let alpha = data[i + 3] / 255.0;

            // stop if brightnesses are all below threshold
            if (red < bright_threshold &&
                green < bright_threshold &&
                blue < bright_threshold) {
                // continue;
            }

            // weigh colors by alpha channel
            red *= alpha;
            green *= alpha;
            blue *= alpha;

            // map color components to cell indicies in each color dimension
            // TODO maybe this should round down? OG colorcube uses python's int()
            let r_index = Math.round(red * (resolution - 1.0));
            let g_index = Math.round(green * (resolution - 1.0));
            let b_index = Math.round(blue * (resolution - 1.0));

            // compute linear cell index
            let index = cell_index(r_index, g_index, b_index);

            // increase hit count of cell
            cells[index].hit_count += 1;

            // add pixel colors to cell color accumulators
            cells[index].r_acc += red;
            cells[index].g_acc += green;
            cells[index].b_acc += blue;
        }

        // we collect local maxima in here
        let local_maxima = [];

        // find local maxima in the grid
        for (let r = 0; r < resolution; r++) {
            for (let g = 0; g < resolution; g++) {
                for (let b = 0; b < resolution; b++) {

                    let local_index = cell_index(r, g, b);

                    // get hit count of this cell
                    let local_hit_count = cells[local_index].hit_count;

                    // if this cell has no hits, ignore it
                    if (local_hit_count === 0) {
                        continue;
                    }

                    // it's a local maxima until we find a neighbor with a higher hit count
                    let is_local_maximum = true;

                    // check if any neighbor has a higher hit count, if so, no local maxima
                    for (let n in new Array(27)) {
                        r_index = r + this.neighbor_indices[n][0];
                        g_index = g + this.neighbor_indices[n][1];
                        b_index = b + this.neighbor_indices[n][2];

                        // only check valid cell indices
                        if (r_index >= 0 && g_index >= 0 && b_index >= 0) {
                            if (r_index < this.resolution && g_index < this.resolution && b_index < this.resolution) {
                                if (this.cells[this.cell_index(r_index, g_index, b_index)].hit_count > local_hit_count) {
                                    // this is not a local maximum
                                    is_local_maximum = false;
                                    break;
                                }
                            }
                        }
                    }

                    // if this is not a local maximum, continue with loop
                    if (is_local_maximum === false) {
                        continue;
                    }

                    // otherwise add this cell as a local maximum
                    let avg_r = cells[local_index].r_acc / cells[local_index].hit_count;
                    let avg_g = cells[local_index].g_acc / cells[local_index].hit_count;
                    let avg_b = cells[local_index].b_acc / cells[local_index].hit_count;
                    let localmaximum = new LocalMaximum(local_hit_count, local_index, avg_r, avg_g, avg_b);

                    local_maxima.push(localmaximum);
                }
            }
        }

        // return local maxima sorted with respect to hit count
        local_maxima = local_maxima.sort(function (a, b) {
            return b.hit_count - a.hit_count;
        });

        return local_maxima;
    };

    // Returns a filtered version of the specified array of maxima,
    // in which all entries have a minimum distance of distinct_threshold
    let filter_distinct_maxima = (maxima) => {

        let result = [];

        // check for each maximum
        for (let m of maxima) {
            // this color is distinct until an earlier color is too close
            let is_distinct = true;

            for (let n of result) {
                // compute delta components
                let r_delta = m.r - n.r;
                let g_delta = m.g - n.g;
                let b_delta = m.b - n.b;

                // compute delta in color space distance
                let delta = Math.sqrt(r_delta * r_delta + g_delta * g_delta + b_delta * b_delta);

                // if too close, mark as non distinct and break inner loop
                if (delta < distinct_threshold) {
                    is_distinct = false;
                    break;
                }
            }

            // add to filtered array if is distinct
            if (is_distinct === true) {
                result.push(m);
            }
        }


        return result;
    };

    return API;
}
// https://snook.ca/technical/colour_contrast/colour.html#fg=000000,bg=00FFFF
function validCombination(fr, fg, fb, br, bg, bb) {

    // perform math for WCAG1
    var brightnessThreshold = 125;
    var colorThreshold = 500;

    var bY = ((br * 299) + (bg * 587) + (bb * 114)) / 1000;
    var fY = ((fr * 299) + (fg * 587) + (fb * 114)) / 1000;
    var brightnessDifference = Math.abs(bY - fY);

    var colorDifference = (Math.max(fr, br) - Math.min(fr, br)) +
        (Math.max(fg, bg) - Math.min(fg, bg)) +
        (Math.max(fb, bb) - Math.min(fb, bb));

    // document.getElementById("bDiff").value = brightnessDifference;
    // document.getElementById("cDiff").value = colorDifference;
    console.log("brightnessDifference", brightnessDifference);
    console.log("colorDifference", colorDifference);

    var valid = false;
    if ((brightnessDifference >= brightnessThreshold) && (colorDifference >= colorThreshold)) {
        // document.getElementById("cResult").value = "YES"; // compliant
        console.log("YES");
        valid = true;
    } else if ((brightnessDifference >= brightnessThreshold) || (colorDifference >= colorThreshold)) {
        // document.getElementById("cResult").value = "sort of..."; // sort of compliant
        console.log("Sort of :/");
        valid = true;
    } else {
        // document.getElementById("cResult").value = "NO"; // not compliant "Poor visibility between text and background colors."
        console.log("NONONONO");
        valid = false;
    }

    // perform math for WCAG2
    function getLuminance(rgb) {

        for (var i = 0; i < rgb.length; i++) {
            if (rgb[i] <= 0.03928) {
                rgb[i] = rgb[i] / 12.92;
            } else {
                rgb[i] = Math.pow(((rgb[i] + 0.055) / 1.055), 2.4);
            }
        }
        var l = (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]);
        return l;
    };
    var ratio = 1;
    var l1 = getLuminance([fr / 255, fg / 255, fb / 255]);
    var l2 = getLuminance([br / 255, bg / 255, bb / 255]);

    if (l1 >= l2) {
        ratio = (l1 + .05) / (l2 + .05);
    } else {
        ratio = (l2 + .05) / (l1 + .05);
    }
    // console.log("contrastratio", ratio);
    ratio = Math.floor(ratio * 1000) / 1000; // round to 3 decimal places
    // document.getElementById('contrastratio').value = ratio;
    // document.getElementById('w2b').value = (ratio >= 4.5 ? 'YES' : 'NO');
    // document.getElementById('w2a').value = (ratio >= 3 ? 'YES' : 'NO');
    // document.getElementById('w2aaab').value = (ratio >= 7 ? 'YES' : 'NO');
    // document.getElementById('w2aaaa').value = (ratio >= 4.5 ? 'YES' : 'NO');
    console.log("contrastratio", ratio);
    console.log("w2b", (ratio >= 4.5 ? 'YES' : 'NO'));
    console.log("w2a", (ratio >= 3 ? 'YES' : 'NO'));
    console.log("w2aaab", (ratio >= 7 ? 'YES' : 'NO'));
    console.log("w2aaaa", (ratio >= 4.5 ? 'YES' : 'NO'))
    return valid && ratio >= 4.5;
}

// https://delta.prcptn.us/main.js
function getContrast(hexcolor) {

    // If a leading # is provided, remove it
    if (hexcolor.slice(0, 1) === '#') {
        hexcolor = hexcolor.slice(1);
    }

    // If a three-character hexcode, make six-character
    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(function (hex) {
            return hex + hex;
        }).join('');
    }

    // Convert to RGB value
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);

    // Get YIQ ratio
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Check contrast
    return (yiq >= 128) ? 'black' : 'white';

};


/**	
 * =========================================================
 * 	UTILITY FUNCTIONS
 *
 */

function pad(s) {
    return ('00' + (new Number(s)).toString(16).toUpperCase()).slice(-2);
}

/**
 * Converts HSV to RGB value.
 *
 * @param {Integer} h Hue as a value between 0 - 360 degrees
 * @param {Integer} s Saturation as a value between 0 - 100 %
 * @param {Integer} v Value as a value between 0 - 100 %
 * @returns {Array} The RGB values  EG: [r,g,b], [255,255,255]
 */
function hsvToRgb(h, s, v) {

    var s = s / 100,
        v = v / 100;

    var hi = Math.floor((h / 60) % 6);
    var f = (h / 60) - hi;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    var rgb = [];

    switch (hi) {
        case 0:
            rgb = [v, t, p];
            break;
        case 1:
            rgb = [q, v, p];
            break;
        case 2:
            rgb = [p, v, t];
            break;
        case 3:
            rgb = [p, q, v];
            break;
        case 4:
            rgb = [t, p, v];
            break;
        case 5:
            rgb = [v, p, q];
            break;
    }

    var r = Math.min(255, Math.round(rgb[0] * 256)),
        g = Math.min(255, Math.round(rgb[1] * 256)),
        b = Math.min(255, Math.round(rgb[2] * 256));

    return [r, g, b];

}

/**
 * Converts RGB to HSV value.
 *
 * @param {Integer} r Red value, 0-255
 * @param {Integer} g Green value, 0-255
 * @param {Integer} b Blue value, 0-255
 * @returns {Array} The HSV values EG: [h,s,v], [0-360 degrees, 0-100%, 0-100%]
 */
function rgbToHsv(r, g, b) {

    var r = (r / 255),
        g = (g / 255),
        b = (b / 255);

    var min = Math.min(Math.min(r, g), b),
        max = Math.max(Math.max(r, g), b),
        delta = max - min;

    var value = max,
        saturation,
        hue;

    // Hue
    if (max == min) {
        hue = 0;
    } else if (max == r) {
        hue = (60 * ((g - b) / (max - min))) % 360;
    } else if (max == g) {
        hue = 60 * ((b - r) / (max - min)) + 120;
    } else if (max == b) {
        hue = 60 * ((r - g) / (max - min)) + 240;
    }

    if (hue < 0) {
        hue += 360;
    }

    // Saturation
    if (max == 0) {
        saturation = 0;
    } else {
        saturation = 1 - (min / max);
    }

    return [Math.round(hue), Math.round(saturation * 100), Math.round(value * 100)];
}

// https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
// h is degrees
// s is in [0, 1]
// l is in [0, 1]
function hslToRGB(h, s, l) {
    [h, s, l] = [h, s / 100, l / 100];

    function f(n) {
        k = n + (h / 30)
        k = k % 12
        a = s * Math.min(l, 1 - l)
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    }
    return [f(0), f(8), f(4)].map(x => Math.round(x * 255))
}

// https://en.wikipedia.org/wiki/HSL_and_HSV#Interconversion
function hsvToHSL(hv, sv, v) {
    // [hv, sv, v] = rgbToHsv(r, g, b);
    sv = sv / 100;
    v = v / 100;
    // console.log([hv, sv, v]);
    hl = hv;
    l = v * (1 - (sv / 2));
    sl = 0;
    if (l == 0 || l == 1) {
        sl = 0;
    } else {
        sl = (v - l) / Math.min(l, 1 - l);
    }
    return [hl % 360, sl * 100, l * 100];
}

// https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB
function rgbToHSL(r, g, b) {
    [r, g, b] = [r / 255, g / 255, b / 255];
    v = Math.max(r, g, b);
    c = v - Math.min(r, g, b);
    l = v - (c / 2);
    h = 0;
    if (c == 0) {
        h = 0;
    } else if (v == r) {
        h = 60 * (g - b) / c;
    } else if (v == g) {
        h = 60 * (2 + (b - r) / c);
    } else if (v == b) {
        h = 60 * (4 + (r - g) / c);
    }
    sl = 0;
    if (l == 0 || l == 1) {
        sl = 0;
    } else {
        sl = (v - l) / Math.min(l, 1 - l);
    }
    return [h % 360, sl * 100, l * 100];
}

// https://serennu.com/colour/rgbtohsl.php
/*
    1. Convert your colour to HSL.
    2. Change the Hue value to that of the Hue opposite (e.g., if your Hue is 50°, the opposite one will be at 230° on the wheel — 180° further around).
    3. Leave the Saturation and Lightness values as they were.
*/
function invertColor(hex) {
    rgb = hexToRgb(hex);
    [r, g, b] = [rgb.r, rgb.g, rgb.b];
    return invertColorRGB(r, g, b);
}

function invertColorRGB(r, g, b) {
    [h, s, l] = rgbToHSL(r, g, b);
    h = h + 180;
    h = h % 360;
    if (r == 0 && g == 0 && b == 0) {
        l = 100;
    } else if (r == 255 && g == 255 && b == 255) {
        l = 0;
    }
    return rgbToHex(...hslToRGB(h, s, l));
}


// https://stackoverflow.com/a/7261283/8608146
function altInvertColor(hex) {
    rgb = hexToRgb(hex);
    // console.log(hex);
    [r, g, b] = [rgb.r, rgb.g, rgb.b];
    return invertColorRGB(r, g, b);
}

function altInvertColorRGB(r, g, b) {
    var sum = Math.min(r, g, b) + Math.max(r, g, b);
    // console.log(sum);
    if (sum > 255) sum = 255;
    // color is black
    if (sum == 0) sum = 255;
    // console.log(...[sum - r, sum - g, sum - b]);
    return rgbToHex(...[sum - r, sum - g, sum - b]);
}


// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function styledConsoleLog(...arguments) {
    arguments = arguments.map((x) => {
        dat = x.split('\n');
        return dat.map((d)=>d.trim()).join('');
    })
    var argArray = [];

    if (arguments.length) {
        var startTagRe = /<span\s+style=(['"])([^'"]*)\1\s*>/gi;
        var endTagRe = /<\/span>/gi;

        var reResultArray;
        argArray.push(arguments[0].replace(startTagRe, '%c').replace(endTagRe, '%c'));
        while (reResultArray = startTagRe.exec(arguments[0])) {
            argArray.push(reResultArray[2]);
            argArray.push('');
        }

        // pass through subsequent args since chrome dev tools does not (yet) support console.log styling of the following form: console.log('%cBlue!', 'color: blue;', '%cRed!', 'color: red;');
        for (var j = 1; j < arguments.length; j++) {
            argArray.push(arguments[j]);
        }
        // argArray =  argArray.map(x=>x.replace(/\n/g,''))
        // console.log(argArray)
    }

    console.log.apply(console, argArray);
}

function addPalete(selector, data){
    const div = document.querySelector(selector);
    div.innerHTML += data;
}
var API_GET="http://localhost:5000/colors",bgImg=document.querySelector("#imgc");bgImg.parentElement.hidden=!0;var imgx=new Image;imgx.onload=function(e){console.log(e),console.log(imgx.naturalWidth,imgx.naturalHeight),bgImg.style.width=""+imgx.naturalWidth,bgImg.style.height=""+imgx.naturalHeight,bgImg.parentElement.hidden=!1};var filename=imagefile;imgx.src="/image/"+filename;var jsonData,fetch_css=function(){var e=document.createElement("link");e.rel="stylesheet",e.type="text/css",e.href="/colorcss/"+filename+"/style.css",document.head.appendChild(e)};fetch_css(),fetch(API_GET+"/"+filename+"/data.json",{method:"GET",headers:{"Content-Type":"application/json"}}).then(function(e){return e.json()}).then(function(e){var o=(jsonData=e).main,t=e.palette,n=e.vibrant_palette,a=e.cube,l=e.rgbaster,c=e.service;console.log(jsonData.main),document.querySelector("#content").style.color=getContrast(o.hex);var r="",s="";t.forEach(function(e){s='<span style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';">         </span>',r+=s}),styledConsoleLog(r),r="",t.forEach(function(e){s='<div style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';">'+e.name+"</div>",r+=s}),addPalete("#pal1",r);r="",s="";n.forEach(function(e){s='<span style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';">         </span>',r+=s}),styledConsoleLog(r),r="",n.forEach(function(e){s='<div style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';"> '+e.name+" </div>",r+=s}),addPalete("#pal2",r);r="",s="";a.forEach(function(e){s='<span style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';">         </span>',r+=s}),styledConsoleLog(r),r="",a.forEach(function(e){s='<div style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';">'+e.name+"</div>",r+=s}),addPalete("#pal3",r);r="",s="";l.forEach(function(e){s='<span style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';">         </span>',r+=s}),styledConsoleLog(r),r="",l.forEach(function(e){s='<div style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';">'+e.name+"</div>",r+=s}),addPalete("#pal4",r);r="",s="";c.forEach(function(e){s='<span style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';">         </span>',r+=s}),styledConsoleLog(r),r="",c.forEach(function(e){s='<div style="color:'+getContrast(e.hex)+";background-color:"+e.hex+';">'+e.name+"</div>",r+=s}),addPalete("#pal5",r)});
// reload for more colors
var colors = {
    'pop': {}
};

colors['pop'][5] = [[[33, 33, 35], [226, 87, 49], [192, 168, 76], [154, 161, 160], [248, 245, 239]], [[0, 0, 0], [254, 254, 254], [243, 240, 152], [169, 167, 100], [87, 86, 67]], [[12, 42, 114], [248, 220, 64], [137, 223, 223], [18, 181, 253], [1, 123, 210]], [[255, 255, 255], [254, 68, 47], [255, 10, 106], [157, 37, 54], [41, 23, 27]], [[244, 241, 238], [66, 188, 198], [243, 159, 32], [220, 34, 78], [52, 52, 51]], [[57, 180, 96], [254, 241, 1], [253, 253, 253], [185, 139, 153], [227, 46, 33]], [[32, 36, 39], [207, 83, 47], [225, 206, 111], [247, 250, 249], [95, 189, 194]], [[35, 14, 39], [255, 64, 0], [243, 180, 31], [243, 212, 139], [255, 255, 255]], [[88, 108, 47], [2, 2, 1], [92, 56, 37], [177, 66, 26], [251, 221, 191]], [[251, 251, 251], [213, 78, 82], [199, 149, 162], [154, 118, 155], [53, 156, 180]], [[255, 255, 255], [58, 168, 59], [254, 181, 2], [241, 90, 36], [0, 113, 188]], [[239, 111, 50], [99, 122, 96], [250, 183, 52], [252, 213, 174], [253, 252, 250]], [[83, 15, 46], [221, 56, 97], [229, 189, 121], [245, 241, 197], [59, 136, 174]], [[255, 255, 255], [249, 195, 1], [166, 205, 57], [57, 185, 111], [89, 171, 217]], [[251, 221, 27], [250, 248, 248], [241, 100, 72], [161, 80, 60], [104, 41, 34]], [[33, 10, 75], [85, 244, 120], [45, 223, 170], [18, 208, 203], [255, 255, 255]], [[254, 254, 255], [0, 0, 0], [80, 80, 80], [92, 62, 255], [157, 140, 253]], [[19, 19, 19], [249, 126, 92], [254, 203, 95], [243, 236, 229], [20, 117, 135]], [[254, 255, 254], [240, 199, 117], [233, 104, 110], [67, 66, 124], [111, 186, 232]], [[255, 255, 255], [2, 2, 3], [7, 109, 230], [252, 121, 199], [233, 14, 8]], [[250, 248, 240], [211, 72, 54], [239, 188, 41], [67, 180, 172], [18, 73, 85]], [[255, 255, 255], [245, 7, 9], [202, 67, 84], [159, 94, 164], [41, 147, 233]], [[231, 231, 231], [50, 23, 14], [246, 44, 14], [239, 201, 16], [47, 174, 181]], [[252, 83, 23], [81, 40, 171], [168, 33, 172], [250, 239, 241], [255, 178, 67]], [[201, 225, 39], [9, 53, 52], [53, 100, 87], [51, 183, 175], [192, 216, 210]], [[237, 237, 237], [144, 170, 254], [226, 150, 195], [146, 91, 151], [35, 31, 33]], [[61, 176, 147], [67, 74, 84], [100, 109, 120], [209, 213, 219], [252, 230, 182]], [[7, 143, 178], [252, 251, 251], [242, 155, 161], [245, 42, 47], [71, 19, 43]], [[255, 255, 255], [105, 92, 101], [40, 56, 56], [116, 121, 67], [197, 161, 85]], [[24, 88, 114], [104, 224, 235], [255, 255, 255], [254, 180, 90], [250, 109, 103]], [[255, 255, 255], [84, 16, 37], [240, 87, 73], [252, 145, 143], [249, 208, 108]], [[57, 51, 51], [193, 134, 44], [163, 163, 164], [225, 189, 193], [163, 104, 130]], [[242, 250, 253], [32, 153, 54], [7, 113, 54], [39, 125, 139], [6, 158, 223]], [[255, 255, 255], [38, 151, 227], [53, 113, 199], [78, 81, 173], [110, 47, 147]], [[24, 37, 53], [141, 118, 64], [247, 155, 42], [208, 220, 186], [110, 196, 164]], [[255, 255, 255], [71, 90, 104], [1, 120, 191], [0, 161, 210], [10, 212, 233]], [[254, 254, 254], [7, 6, 7], [93, 65, 65], [154, 10, 12], [236, 59, 53]], [[255, 255, 255], [0, 151, 159], [13, 87, 91], [1, 1, 1], [246, 64, 37]], [[62, 34, 33], [254, 254, 254], [254, 207, 91], [242, 144, 32], [14, 46, 106]], [[6, 0, 250], [231, 97, 63], [250, 250, 255], [238, 198, 26], [75, 181, 118]], [[66, 63, 63], [236, 231, 210], [244, 170, 15], [184, 113, 22], [13, 103, 178]], [[89, 183, 163], [253, 254, 254], [254, 182, 2], [235, 93, 84], [84, 31, 59]], [[253, 253, 253], [231, 23, 114], [45, 176, 206], [6, 170, 135], [224, 224, 15]], [[255, 255, 255], [69, 197, 194], [252, 171, 0], [236, 74, 101], [58, 49, 41]], [[253, 253, 253], [253, 228, 47], [249, 69, 31], [71, 72, 72], [16, 163, 246]], [[255, 255, 255], [0, 102, 175], [1, 1, 1], [214, 32, 48], [255, 193, 14]], [[4, 69, 70], [251, 226, 210], [192, 184, 169], [222, 153, 81], [190, 91, 52]], [[255, 255, 255], [121, 195, 197], [30, 79, 145], [45, 40, 76], [226, 65, 36]], [[242, 253, 255], [31, 187, 229], [0, 53, 71], [185, 70, 70], [254, 29, 134]], [[0, 130, 140], [38, 38, 37], [255, 168, 0], [248, 216, 184], [84, 221, 221]], [[24, 32, 34], [120, 92, 69], [193, 107, 73], [221, 213, 195], [113, 153, 159]], [[26, 186, 158], [15, 35, 69], [208, 45, 46], [244, 246, 247], [245, 210, 14]], [[239, 241, 194], [12, 144, 166], [212, 161, 37], [201, 80, 56], [75, 20, 47]], [[0, 41, 54], [255, 255, 255], [184, 118, 18], [167, 60, 37], [94, 39, 28]], [[23, 34, 112], [2, 2, 3], [199, 77, 102], [245, 244, 243], [48, 170, 109]], [[69, 179, 156], [239, 201, 77], [236, 239, 240], [245, 55, 85], [68, 71, 69]], [[255, 255, 255], [33, 29, 26], [237, 50, 87], [241, 185, 15], [27, 210, 236]], [[248, 241, 213], [237, 43, 50], [246, 154, 44], [28, 119, 161], [39, 92, 69]], [[26, 31, 50], [82, 162, 205], [251, 251, 251], [208, 170, 86], [230, 54, 107]], [[251, 251, 251], [255, 50, 48], [255, 2, 106], [80, 78, 78], [0, 0, 0]], [[255, 255, 255], [41, 170, 181], [251, 171, 19], [213, 45, 29], [29, 29, 29]], [[129, 118, 255], [252, 115, 151], [254, 254, 254], [35, 219, 234], [252, 206, 12]], [[255, 255, 245], [74, 10, 89], [153, 86, 173], [192, 153, 203], [196, 195, 78]], [[238, 66, 54], [253, 240, 4], [251, 249, 246], [5, 174, 239], [39, 32, 31]], [[245, 221, 87], [56, 16, 8], [191, 82, 50], [251, 251, 250], [84, 201, 157]], [[242, 242, 242], [250, 240, 1], [107, 58, 71], [42, 27, 29], [33, 124, 214]], [[253, 252, 246], [234, 85, 128], [16, 34, 58], [8, 189, 178], [253, 206, 5]], [[255, 255, 255], [236, 11, 143], [237, 48, 42], [252, 199, 27], [122, 205, 199]], [[0, 0, 0], [139, 44, 164], [206, 43, 91], [249, 42, 27], [245, 239, 217]], [[249, 245, 232], [35, 14, 51], [76, 50, 77], [165, 126, 128], [193, 51, 27]], [[33, 41, 57], [109, 229, 245], [217, 232, 220], [188, 116, 87], [112, 88, 76]], [[243, 240, 221], [182, 64, 113], [235, 110, 159], [224, 176, 184], [249, 195, 8]], [[254, 206, 0], [210, 212, 215], [163, 110, 79], [105, 100, 84], [9, 8, 10]], [[255, 237, 227], [49, 44, 98], [175, 51, 60], [232, 66, 77], [234, 111, 155]], [[35, 33, 32], [80, 208, 97], [255, 223, 73], [251, 114, 70], [0, 84, 208]], [[64, 76, 89], [244, 244, 245], [230, 221, 123], [223, 151, 83], [215, 73, 39]], [[227, 85, 52], [239, 190, 59], [246, 246, 246], [62, 172, 180], [35, 35, 36]], [[255, 255, 255], [29, 29, 27], [92, 92, 91], [212, 62, 57], [245, 181, 23]], [[50, 51, 45], [119, 137, 85], [154, 180, 87], [227, 227, 208], [64, 155, 212]], [[203, 121, 234], [229, 152, 137], [204, 92, 73], [91, 59, 69], [5, 4, 5]], [[55, 62, 135], [229, 65, 76], [19, 166, 232], [36, 182, 64], [253, 217, 2]], [[77, 50, 104], [250, 208, 230], [237, 89, 165], [61, 109, 123], [86, 220, 140]], [[171, 65, 54], [246, 244, 230], [195, 178, 157], [188, 148, 95], [55, 54, 53]], [[255, 255, 255], [1, 172, 65], [253, 197, 18], [253, 69, 57], [3, 139, 249]], [[255, 255, 255], [132, 186, 64], [238, 176, 29], [230, 44, 55], [43, 102, 176]], [[255, 255, 255], [85, 92, 122], [168, 109, 131], [218, 113, 125], [254, 187, 103]], [[244, 244, 244], [29, 44, 55], [20, 78, 88], [186, 106, 68], [139, 188, 64]], [[97, 109, 107], [213, 243, 52], [213, 29, 79], [40, 17, 38], [65, 74, 172]], [[237, 238, 242], [150, 80, 57], [69, 84, 88], [88, 122, 173], [124, 164, 109]], [[254, 254, 254], [7, 6, 9], [63, 58, 86], [47, 63, 191], [240, 58, 58]], [[255, 255, 255], [55, 97, 159], [126, 185, 194], [223, 156, 57], [209, 113, 107]], [[20, 210, 0], [2, 4, 3], [254, 70, 75], [216, 228, 238], [1, 173, 254]], [[106, 49, 204], [186, 33, 17], [239, 51, 26], [246, 239, 242], [254, 208, 1]], [[254, 189, 9], [230, 236, 241], [129, 145, 249], [84, 80, 254], [46, 1, 212]], [[36, 23, 51], [253, 253, 253], [158, 158, 160], [123, 116, 132], [69, 105, 185]], [[48, 28, 28], [254, 241, 195], [156, 136, 39], [96, 89, 28], [199, 78, 5]], [[255, 255, 255], [244, 226, 49], [236, 102, 79], [16, 55, 175], [17, 41, 43]], [[241, 238, 227], [42, 41, 43], [109, 41, 38], [186, 56, 60], [216, 160, 63]], [[255, 14, 72], [203, 210, 216], [1, 115, 184], [29, 77, 117], [2, 3, 3]], [[0, 0, 0], [180, 206, 31], [158, 178, 174], [253, 253, 253], [250, 106, 2]], [[235, 235, 233], [44, 48, 52], [212, 92, 95], [139, 139, 139], [163, 165, 90]], [[198, 36, 1], [38, 31, 27], [171, 152, 145], [208, 197, 194], [231, 169, 11]], [[255, 255, 255], [220, 95, 105], [167, 65, 115], [95, 46, 84], [68, 13, 24]], [[255, 255, 255], [43, 158, 161], [239, 159, 57], [227, 34, 31], [126, 37, 70]], [[255, 255, 255], [29, 189, 221], [149, 147, 149], [239, 91, 88], [47, 46, 49]], [[252, 165, 138], [254, 218, 254], [213, 169, 224], [207, 119, 175], [108, 89, 166]], [[72, 94, 92], [231, 224, 206], [234, 145, 134], [110, 87, 114], [80, 50, 60]], [[237, 28, 36], [255, 255, 255], [254, 178, 17], [24, 92, 81], [6, 2, 3]], [[249, 188, 21], [50, 168, 83], [104, 164, 252], [43, 57, 143], [232, 68, 53]], [[241, 182, 112], [6, 5, 6], [94, 93, 81], [141, 189, 220], [252, 253, 252]], [[224, 230, 244], [45, 182, 216], [85, 86, 153], [37, 13, 105], [248, 115, 92]], [[255, 227, 35], [255, 255, 254], [239, 68, 35], [16, 100, 247], [0, 0, 0]], [[194, 38, 45], [214, 210, 214], [207, 157, 13], [174, 132, 105], [46, 33, 32]], [[255, 255, 255], [20, 157, 194], [145, 109, 203], [247, 98, 116], [247, 168, 70]], [[255, 254, 249], [244, 135, 244], [243, 144, 165], [253, 103, 19], [1, 1, 1]], [[209, 70, 63], [253, 207, 101], [249, 249, 249], [144, 223, 245], [35, 45, 55]], [[0, 0, 0], [95, 0, 32], [209, 1, 53], [255, 138, 0], [249, 249, 249]], [[58, 115, 94], [41, 41, 40], [188, 160, 93], [242, 203, 108], [208, 195, 185]], [[12, 29, 37], [102, 206, 205], [254, 195, 1], [253, 133, 1], [241, 80, 2]], [[253, 253, 254], [75, 29, 94], [82, 73, 140], [120, 72, 118], [247, 97, 146]], [[242, 242, 242], [16, 110, 102], [20, 93, 143], [206, 66, 60], [235, 183, 48]], [[72, 193, 188], [252, 252, 252], [240, 75, 53], [142, 98, 75], [75, 68, 61]], [[255, 255, 255], [255, 205, 54], [255, 122, 79], [203, 113, 225], [83, 191, 213]], [[7, 30, 65], [248, 249, 249], [160, 169, 181], [145, 113, 72], [248, 149, 8]], [[1, 82, 42], [60, 35, 19], [118, 76, 41], [164, 126, 90], [197, 184, 160]], [[0, 0, 0], [230, 217, 168], [194, 157, 83], [190, 104, 61], [178, 3, 16]], [[255, 255, 255], [14, 31, 39], [64, 169, 245], [253, 113, 2], [169, 198, 118]], [[206, 15, 66], [39, 31, 28], [8, 137, 82], [204, 163, 83], [253, 250, 251]], [[255, 190, 52], [255, 161, 172], [204, 204, 204], [0, 92, 68], [3, 2, 1]], [[74, 193, 197], [252, 252, 252], [227, 147, 36], [158, 106, 18], [49, 52, 50]], [[37, 54, 71], [62, 179, 146], [252, 252, 252], [243, 173, 121], [235, 118, 123]], [[20, 20, 20], [56, 54, 207], [57, 174, 204], [219, 215, 218], [204, 54, 54]], [[254, 254, 255], [89, 92, 122], [192, 111, 128], [255, 188, 103], [108, 172, 141]], [[255, 255, 255], [54, 13, 78], [138, 17, 66], [253, 94, 5], [251, 173, 11]], [[10, 25, 43], [1, 106, 85], [6, 177, 83], [80, 219, 73], [243, 244, 245]], [[2, 26, 60], [155, 40, 108], [230, 76, 84], [242, 144, 77], [247, 225, 107]], [[26, 2, 25], [99, 1, 2], [237, 13, 1], [244, 189, 1], [249, 248, 249]], [[255, 255, 255], [1, 1, 1], [57, 29, 114], [153, 153, 153], [243, 158, 68]], [[52, 101, 167], [161, 198, 83], [216, 188, 48], [222, 131, 121], [4, 5, 5]], [[44, 121, 227], [1, 1, 1], [191, 58, 89], [239, 238, 237], [252, 184, 21]], [[0, 21, 38], [250, 92, 57], [236, 151, 114], [250, 251, 235], [104, 219, 195]], [[228, 94, 76], [39, 36, 45], [102, 157, 122], [235, 214, 187], [253, 253, 253]], [[255, 255, 255], [244, 145, 28], [169, 28, 63], [49, 56, 58], [19, 126, 142]], [[252, 252, 252], [255, 197, 78], [251, 155, 154], [232, 97, 85], [73, 116, 165]], [[207, 158, 151], [254, 255, 255], [9, 180, 154], [105, 108, 192], [51, 53, 82]], [[229, 236, 241], [5, 5, 5], [98, 55, 255], [139, 113, 255], [255, 244, 0]], [[255, 255, 255], [201, 196, 25], [110, 191, 180], [175, 154, 190], [188, 96, 170]], [[255, 255, 255], [72, 23, 19], [3, 81, 48], [96, 193, 173], [253, 209, 8]], [[77, 77, 77], [241, 106, 112], [243, 243, 243], [200, 222, 124], [91, 196, 191]], [[250, 250, 250], [203, 30, 31], [121, 141, 139], [90, 96, 95], [4, 4, 4]], [[255, 252, 245], [255, 188, 20], [200, 147, 62], [195, 65, 52], [68, 62, 223]], [[251, 252, 252], [27, 166, 160], [252, 151, 29], [239, 16, 116], [126, 66, 111]], [[255, 255, 255], [17, 136, 197], [109, 108, 109], [113, 144, 92], [243, 92, 32]], [[254, 255, 254], [248, 158, 26], [215, 23, 114], [51, 60, 143], [38, 34, 35]], [[41, 51, 60], [87, 93, 57], [125, 129, 112], [253, 253, 253], [255, 252, 1]], [[250, 222, 234], [240, 153, 81], [233, 78, 138], [188, 60, 79], [27, 26, 27]], [[248, 182, 186], [201, 195, 101], [249, 244, 222], [129, 66, 89], [54, 40, 40]], [[0, 109, 172], [0, 0, 0], [31, 175, 124], [172, 174, 179], [254, 255, 255]], [[248, 248, 248], [216, 223, 84], [86, 190, 202], [3, 3, 3], [233, 51, 102]], [[16, 16, 16], [167, 76, 98], [205, 109, 39], [245, 181, 40], [232, 229, 230]], [[255, 255, 255], [147, 189, 31], [2, 103, 51], [117, 59, 151], [200, 153, 212]], [[44, 44, 44], [253, 97, 86], [202, 102, 61], [250, 139, 64], [249, 245, 243]], [[0, 0, 0], [217, 57, 57], [242, 135, 200], [254, 251, 249], [248, 189, 34]], [[254, 254, 254], [232, 156, 146], [142, 142, 142], [76, 146, 225], [60, 60, 61]], [[80, 80, 80], [247, 247, 247], [223, 207, 167], [252, 177, 42], [181, 74, 57]], [[227, 227, 229], [227, 152, 151], [100, 79, 86], [62, 126, 140], [104, 168, 182]], [[254, 254, 254], [190, 71, 140], [242, 103, 65], [238, 197, 55], [110, 202, 206]], [[234, 56, 56], [87, 222, 199], [243, 244, 244], [195, 191, 183], [84, 70, 68]], [[254, 254, 254], [9, 8, 6], [87, 88, 69], [127, 169, 73], [241, 114, 33]], [[247, 190, 21], [59, 25, 16], [186, 34, 38], [237, 93, 40], [253, 245, 240]], [[255, 255, 255], [244, 182, 33], [236, 44, 39], [22, 21, 22], [64, 105, 179]], [[5, 7, 6], [201, 35, 45], [171, 166, 161], [234, 234, 234], [93, 167, 185]], [[34, 31, 32], [244, 242, 223], [181, 176, 171], [244, 152, 17], [207, 109, 15]], [[89, 75, 98], [84, 176, 57], [237, 209, 141], [246, 188, 37], [242, 44, 11]], [[74, 74, 74], [194, 36, 98], [236, 73, 137], [162, 162, 162], [215, 215, 215]], [[255, 255, 255], [58, 199, 244], [100, 188, 70], [245, 215, 16], [238, 52, 40]], [[255, 255, 255], [65, 65, 79], [43, 180, 171], [58, 175, 86], [176, 211, 65]], [[14, 143, 151], [255, 255, 255], [198, 220, 224], [168, 54, 73], [30, 73, 99]], [[250, 251, 252], [23, 20, 21], [83, 93, 95], [83, 136, 145], [241, 107, 100]], [[232, 231, 227], [62, 66, 76], [232, 82, 98], [252, 123, 172], [249, 180, 7]], [[255, 255, 255], [76, 139, 199], [17, 88, 139], [205, 39, 55], [248, 207, 15]], [[36, 41, 81], [230, 105, 77], [240, 144, 178], [240, 235, 227], [235, 197, 84]], [[254, 254, 254], [8, 29, 79], [31, 105, 189], [97, 164, 195], [85, 171, 146]], [[142, 0, 28], [255, 255, 255], [195, 195, 195], [215, 100, 42], [7, 27, 62]], [[36, 165, 171], [242, 226, 219], [177, 171, 167], [170, 106, 74], [33, 35, 33]], [[38, 38, 38], [250, 97, 50], [254, 165, 8], [253, 254, 254], [0, 189, 191]], [[63, 67, 166], [252, 230, 227], [242, 169, 199], [209, 85, 161], [13, 12, 12]], [[254, 237, 0], [29, 29, 24], [225, 14, 126], [242, 180, 207], [252, 244, 248]], [[244, 244, 243], [254, 200, 62], [255, 132, 78], [253, 31, 3], [71, 171, 253]], [[80, 92, 234], [241, 191, 93], [240, 236, 242], [206, 61, 145], [25, 36, 80]], [[255, 255, 255], [0, 10, 56], [100, 36, 255], [175, 165, 242], [62, 180, 226]], [[25, 37, 87], [242, 155, 116], [231, 231, 231], [166, 165, 177], [108, 109, 137]], [[255, 255, 255], [15, 25, 35], [237, 59, 95], [245, 202, 12], [62, 191, 235]], [[255, 255, 255], [248, 165, 124], [153, 88, 34], [108, 60, 35], [53, 26, 15]], [[255, 255, 255], [173, 169, 95], [200, 136, 161], [167, 86, 119], [83, 64, 83]], [[255, 255, 255], [42, 40, 41], [242, 120, 34], [242, 158, 33], [245, 213, 25]], [[19, 34, 44], [84, 146, 148], [228, 237, 234], [214, 213, 176], [242, 196, 68]], [[240, 240, 247], [7, 234, 183], [17, 174, 198], [25, 93, 212], [31, 13, 227]], [[255, 203, 26], [129, 194, 191], [20, 118, 245], [34, 32, 61], [234, 92, 77]], [[255, 255, 255], [203, 64, 34], [20, 29, 14], [64, 91, 35], [134, 173, 61]], [[254, 185, 64], [40, 33, 28], [230, 71, 76], [238, 201, 204], [87, 197, 208]], [[255, 255, 255], [237, 87, 54], [81, 18, 97], [43, 99, 175], [101, 169, 220]], [[255, 254, 254], [242, 93, 65], [198, 158, 160], [144, 124, 133], [83, 91, 109]], [[3, 3, 2], [94, 137, 45], [139, 175, 82], [253, 253, 253], [235, 111, 33]], [[255, 255, 255], [23, 212, 207], [245, 154, 11], [198, 31, 116], [97, 9, 183]], [[224, 82, 67], [251, 183, 87], [253, 251, 248], [137, 174, 178], [16, 13, 12]], [[23, 0, 255], [0, 0, 0], [243, 40, 40], [253, 253, 254], [94, 197, 26]], [[234, 234, 234], [47, 46, 45], [177, 94, 145], [228, 115, 53], [143, 158, 64]], [[150, 216, 247], [249, 239, 225], [203, 81, 81], [154, 51, 56], [74, 85, 91]], [[29, 33, 80], [47, 164, 218], [248, 246, 231], [252, 182, 20], [240, 85, 41]], [[33, 33, 33], [1, 130, 108], [199, 198, 198], [240, 184, 36], [210, 98, 28]], [[255, 255, 255], [66, 98, 171], [106, 198, 207], [250, 174, 65], [237, 65, 55]], [[221, 5, 6], [242, 242, 242], [203, 165, 65], [114, 111, 113], [3, 2, 3]], [[1, 65, 71], [182, 130, 19], [143, 192, 62], [101, 165, 120], [175, 215, 183]], [[255, 255, 255], [14, 231, 145], [12, 201, 233], [13, 155, 254], [6, 10, 11]], [[255, 255, 255], [54, 183, 213], [45, 59, 82], [106, 76, 152], [236, 90, 74]], [[65, 65, 67], [244, 134, 72], [255, 213, 114], [158, 174, 59], [255, 255, 255]], [[254, 193, 7], [244, 66, 54], [34, 149, 242], [253, 253, 253], [75, 175, 79]], [[83, 170, 225], [2, 2, 2], [192, 36, 48], [231, 213, 192], [245, 192, 33]], [[255, 255, 255], [9, 53, 210], [246, 91, 172], [162, 183, 248], [254, 200, 97]], [[253, 254, 253], [10, 10, 10], [94, 94, 87], [125, 127, 98], [225, 229, 84]], [[238, 221, 0], [204, 34, 85], [51, 51, 51], [18, 153, 254], [255, 255, 255]], [[183, 7, 34], [8, 9, 10], [136, 124, 131], [159, 160, 166], [249, 249, 249]], [[237, 237, 237], [253, 182, 65], [0, 189, 205], [118, 121, 182], [10, 6, 81]], [[16, 90, 121], [97, 172, 207], [231, 201, 170], [71, 151, 78], [82, 58, 36]], [[255, 255, 255], [5, 5, 30], [120, 11, 247], [255, 85, 223], [255, 201, 67]], [[2, 2, 0], [246, 204, 94], [253, 253, 253], [185, 182, 180], [221, 83, 82]], [[255, 255, 255], [255, 196, 65], [254, 109, 66], [252, 52, 62], [40, 38, 79]], [[15, 16, 19], [146, 62, 146], [100, 93, 158], [76, 131, 161], [255, 255, 255]], [[244, 243, 241], [249, 197, 19], [239, 123, 117], [237, 80, 177], [43, 37, 67]], [[238, 244, 215], [17, 45, 162], [73, 93, 171], [112, 132, 183], [165, 179, 197]], [[255, 255, 255], [5, 45, 50], [3, 93, 195], [14, 140, 189], [244, 220, 50]], [[0, 27, 54], [1, 131, 125], [0, 167, 150], [237, 190, 40], [233, 119, 4]], [[254, 254, 254], [247, 156, 46], [188, 28, 142], [102, 46, 144], [46, 42, 44]], [[245, 245, 245], [2, 2, 2], [99, 103, 101], [23, 184, 182], [228, 157, 63]], [[255, 252, 236], [31, 28, 28], [71, 70, 70], [82, 60, 21], [159, 133, 85]], [[254, 254, 254], [70, 149, 140], [151, 161, 91], [216, 82, 45], [37, 33, 34]], [[255, 255, 255], [238, 65, 53], [0, 0, 0], [90, 90, 81], [157, 199, 40]], [[0, 0, 1], [240, 241, 250], [20, 134, 91], [80, 78, 152], [126, 11, 65]], [[255, 255, 255], [1, 173, 239], [35, 32, 33], [241, 89, 42], [248, 174, 27]], [[209, 69, 46], [48, 86, 44], [163, 193, 170], [249, 239, 227], [250, 179, 92]], [[225, 195, 63], [68, 37, 97], [227, 4, 124], [247, 248, 248], [110, 200, 231]], [[255, 90, 60], [239, 182, 50], [251, 248, 248], [53, 120, 216], [108, 43, 63]], [[214, 85, 71], [232, 161, 82], [237, 196, 86], [248, 238, 216], [119, 153, 206]], [[253, 208, 79], [54, 224, 195], [255, 255, 255], [240, 87, 112], [18, 33, 28]], [[253, 231, 107], [103, 103, 102], [243, 147, 164], [255, 255, 255], [150, 210, 237]], [[7, 255, 248], [61, 5, 34], [122, 9, 66], [178, 88, 146], [244, 17, 131]], [[255, 202, 67], [13, 18, 59], [4, 93, 217], [97, 136, 162], [235, 238, 241]], [[243, 242, 238], [65, 141, 203], [37, 38, 102], [141, 84, 166], [254, 143, 121]], [[255, 184, 127], [255, 255, 255], [95, 78, 138], [1, 40, 126], [0, 0, 0]], [[108, 153, 72], [240, 229, 203], [254, 216, 35], [232, 171, 27], [88, 62, 38]], [[0, 0, 0], [57, 92, 161], [236, 215, 211], [255, 194, 14], [71, 138, 52]], [[255, 255, 255], [1, 1, 1], [97, 119, 204], [95, 95, 95], [225, 207, 30]], [[199, 230, 229], [206, 79, 139], [234, 126, 171], [236, 192, 179], [242, 219, 232]], [[251, 251, 251], [3, 3, 3], [118, 3, 53], [200, 18, 90], [249, 70, 142]], [[26, 32, 46], [30, 112, 65], [175, 219, 151], [253, 253, 253], [188, 84, 63]], [[35, 29, 51], [213, 53, 93], [253, 253, 253], [98, 146, 179], [40, 93, 115]], [[2, 3, 2], [253, 250, 79], [0, 184, 187], [9, 128, 132], [29, 81, 76]], [[16, 0, 32], [255, 251, 233], [163, 154, 254], [190, 111, 145], [67, 81, 94]], [[253, 254, 255], [3, 3, 3], [254, 1, 1], [253, 89, 88], [237, 125, 15]], [[22, 42, 66], [251, 249, 249], [185, 202, 146], [209, 163, 79], [213, 95, 82]], [[240, 247, 246], [225, 70, 89], [188, 158, 214], [99, 68, 243], [0, 0, 0]], [[255, 255, 255], [235, 89, 44], [163, 59, 34], [95, 77, 68], [19, 168, 158]], [[0, 82, 99], [58, 164, 147], [239, 198, 67], [236, 165, 70], [236, 123, 71]], [[255, 199, 64], [86, 28, 14], [179, 41, 49], [224, 224, 222], [96, 160, 143]], [[255, 255, 255], [32, 180, 161], [42, 126, 183], [47, 63, 81], [232, 77, 62]], [[255, 255, 255], [43, 37, 29], [156, 126, 116], [249, 115, 136], [237, 202, 85]], [[255, 255, 255], [227, 37, 96], [33, 48, 92], [66, 82, 142], [43, 171, 225]], [[255, 255, 255], [77, 35, 103], [235, 73, 99], [255, 211, 103], [47, 191, 200]], [[40, 40, 40], [192, 100, 250], [130, 129, 240], [102, 168, 248], [105, 221, 252]], [[255, 255, 255], [3, 180, 170], [250, 163, 21], [234, 36, 37], [34, 28, 52]], [[222, 222, 219], [0, 50, 61], [26, 92, 85], [89, 139, 134], [254, 165, 76]], [[255, 255, 255], [234, 77, 138], [1, 1, 1], [122, 186, 93], [92, 211, 219]], [[167, 203, 103], [7, 4, 5], [172, 57, 102], [233, 77, 137], [244, 171, 199]], [[254, 254, 254], [249, 202, 10], [222, 59, 49], [92, 89, 80], [5, 5, 5]], [[254, 254, 254], [132, 194, 34], [56, 102, 36], [1, 1, 0], [218, 0, 7]], [[1, 0, 0], [86, 182, 221], [250, 251, 250], [251, 198, 45], [254, 31, 1]], [[255, 255, 255], [231, 13, 98], [4, 55, 53], [8, 243, 212], [199, 219, 50]], [[255, 255, 255], [27, 20, 102], [194, 77, 236], [172, 156, 212], [82, 201, 187]], [[240, 109, 161], [77, 89, 150], [103, 118, 212], [88, 154, 242], [193, 207, 243]], [[128, 175, 68], [223, 80, 46], [251, 159, 10], [250, 251, 253], [96, 114, 232]], [[255, 255, 255], [68, 141, 204], [86, 79, 161], [116, 38, 121], [166, 44, 87]], [[249, 248, 239], [3, 30, 36], [188, 142, 53], [217, 105, 68], [249, 141, 168]], [[255, 255, 255], [31, 43, 88], [91, 95, 141], [159, 114, 255], [254, 97, 182]], [[255, 255, 255], [47, 80, 87], [101, 195, 190], [172, 172, 73], [238, 91, 76]], [[255, 255, 255], [16, 38, 103], [243, 48, 84], [247, 174, 104], [41, 172, 165]], [[254, 254, 255], [241, 162, 254], [178, 170, 253], [96, 179, 254], [73, 73, 73]], [[251, 251, 251], [58, 184, 110], [91, 91, 91], [44, 44, 44], [205, 94, 79]], [[255, 255, 255], [44, 169, 224], [205, 144, 21], [119, 92, 68], [44, 34, 25]], [[255, 255, 255], [253, 74, 17], [254, 213, 66], [81, 184, 91], [19, 59, 31]], [[255, 100, 1], [255, 244, 220], [255, 144, 177], [195, 62, 102], [110, 44, 80]], [[255, 255, 255], [6, 6, 6], [112, 3, 192], [7, 136, 254], [255, 203, 13]], [[248, 249, 251], [41, 46, 48], [182, 94, 201], [169, 153, 179], [249, 78, 126]], [[178, 170, 247], [100, 6, 50], [178, 112, 79], [201, 249, 234], [1, 246, 173]], [[0, 0, 0], [238, 231, 37], [223, 229, 228], [231, 32, 38], [58, 83, 164]], [[255, 255, 255], [98, 98, 98], [101, 158, 190], [145, 145, 145], [234, 199, 62]], [[0, 0, 0], [248, 136, 25], [242, 99, 33], [202, 34, 53], [93, 40, 50]], [[42, 28, 53], [217, 113, 69], [236, 236, 237], [172, 205, 233], [138, 184, 165]], [[45, 51, 58], [254, 254, 254], [115, 196, 212], [152, 160, 165], [225, 118, 80]], [[219, 92, 65], [68, 49, 46], [145, 155, 117], [189, 170, 156], [240, 240, 225]], [[67, 194, 203], [250, 248, 204], [250, 172, 25], [221, 85, 83], [133, 45, 84]], [[57, 177, 246], [243, 248, 249], [253, 213, 21], [244, 172, 111], [190, 96, 41]], [[136, 197, 248], [243, 234, 204], [246, 182, 18], [243, 72, 64], [10, 34, 65]], [[12, 13, 31], [106, 191, 144], [78, 149, 119], [61, 83, 81], [201, 84, 96]], [[0, 0, 0], [231, 71, 62], [220, 225, 227], [146, 215, 232], [116, 168, 181]], [[33, 82, 154], [70, 178, 169], [252, 250, 253], [175, 173, 185], [253, 42, 89]], [[241, 242, 243], [252, 194, 72], [74, 203, 137], [76, 166, 162], [88, 80, 52]], [[242, 141, 70], [125, 185, 159], [239, 224, 183], [175, 90, 89], [106, 52, 91]], [[0, 0, 0], [241, 226, 207], [242, 178, 166], [253, 133, 113], [204, 93, 72]], [[255, 211, 64], [1, 1, 1], [83, 13, 108], [233, 67, 100], [253, 251, 249]], [[252, 176, 64], [96, 60, 22], [199, 92, 39], [249, 248, 246], [9, 148, 68]], [[30, 33, 40], [252, 252, 249], [192, 208, 156], [216, 189, 97], [237, 118, 76]], [[255, 255, 255], [2, 2, 2], [92, 92, 92], [254, 164, 5], [74, 219, 154]], [[28, 26, 27], [217, 62, 57], [234, 234, 234], [175, 173, 174], [46, 113, 207]], [[251, 251, 251], [214, 178, 60], [237, 59, 80], [37, 57, 73], [0, 120, 166]], [[75, 34, 69], [131, 207, 149], [251, 248, 239], [171, 152, 206], [238, 101, 94]], [[255, 255, 255], [250, 181, 22], [102, 138, 120], [72, 100, 87], [4, 7, 7]], [[0, 0, 0], [254, 254, 254], [94, 167, 238], [171, 106, 234], [229, 129, 239]], [[255, 255, 255], [255, 215, 2], [255, 145, 50], [255, 35, 125], [80, 37, 68]], [[243, 236, 226], [39, 50, 78], [127, 53, 130], [241, 109, 126], [243, 181, 54]], [[255, 255, 255], [75, 1, 164], [122, 0, 241], [181, 138, 210], [253, 121, 172]], [[250, 255, 253], [47, 48, 43], [153, 157, 188], [11, 162, 143], [251, 208, 2]], [[255, 255, 255], [37, 35, 95], [69, 64, 171], [243, 157, 201], [235, 104, 51]], [[254, 255, 254], [235, 23, 120], [34, 110, 182], [31, 30, 86], [0, 0, 1]], [[236, 180, 42], [9, 6, 3], [103, 72, 35], [205, 78, 40], [240, 222, 218]], [[255, 255, 255], [253, 157, 124], [110, 177, 218], [41, 103, 154], [35, 31, 31]], [[255, 255, 255], [25, 23, 30], [20, 85, 161], [240, 96, 57], [245, 173, 64]], [[255, 255, 255], [233, 93, 91], [237, 169, 181], [93, 113, 179], [57, 27, 49]], [[253, 253, 254], [2, 210, 252], [138, 124, 77], [230, 153, 225], [49, 56, 150]], [[255, 255, 255], [207, 96, 78], [49, 55, 67], [54, 134, 187], [39, 173, 137]], [[119, 166, 238], [44, 44, 44], [67, 78, 94], [189, 170, 167], [111, 183, 164]], [[12, 24, 37], [67, 93, 193], [207, 188, 194], [195, 94, 63], [178, 130, 3]], [[0, 0, 0], [90, 186, 42], [229, 199, 48], [252, 162, 12], [160, 50, 18]], [[255, 255, 255], [0, 28, 56], [0, 130, 194], [1, 233, 233], [248, 148, 140]], [[31, 34, 43], [227, 191, 163], [243, 246, 249], [176, 212, 254], [114, 129, 150]], [[240, 85, 85], [240, 156, 84], [218, 220, 223], [72, 169, 131], [59, 33, 52]], [[247, 211, 64], [254, 254, 252], [64, 146, 193], [110, 96, 83], [1, 1, 1]], [[159, 189, 226], [254, 203, 68], [246, 229, 203], [241, 89, 38], [35, 25, 78]], [[32, 30, 51], [254, 193, 32], [246, 65, 64], [83, 61, 241], [72, 202, 250]], [[33, 38, 43], [253, 210, 63], [251, 251, 251], [164, 175, 167], [112, 192, 151]], [[247, 247, 247], [231, 32, 41], [190, 35, 74], [101, 102, 168], [18, 31, 76]], [[26, 51, 45], [82, 119, 23], [103, 156, 20], [210, 202, 12], [240, 242, 242]], [[230, 163, 46], [132, 45, 26], [240, 74, 36], [254, 252, 237], [65, 168, 121]], [[15, 1, 254], [1, 1, 1], [237, 98, 159], [255, 179, 219], [248, 246, 247]], [[255, 255, 255], [2, 3, 5], [17, 62, 96], [50, 104, 160], [72, 152, 168]], [[240, 239, 234], [253, 83, 72], [198, 63, 59], [57, 50, 55], [43, 137, 189]], [[5, 7, 8], [226, 225, 220], [205, 173, 98], [152, 105, 73], [199, 40, 43]], [[254, 160, 104], [102, 50, 148], [177, 124, 204], [85, 191, 229], [240, 230, 97]], [[249, 159, 97], [135, 231, 83], [250, 250, 250], [174, 175, 174], [69, 89, 96]], [[255, 255, 255], [7, 63, 248], [63, 25, 81], [252, 6, 101], [250, 220, 7]], [[255, 255, 255], [41, 173, 227], [69, 30, 85], [232, 60, 48], [255, 231, 1]], [[255, 255, 255], [84, 179, 224], [125, 87, 164], [231, 116, 126], [236, 209, 24]], [[255, 244, 128], [12, 5, 8], [74, 82, 51], [82, 204, 101], [233, 233, 238]], [[215, 138, 120], [140, 189, 193], [224, 225, 211], [133, 78, 98], [45, 34, 40]], [[229, 131, 131], [0, 0, 1], [52, 152, 219], [29, 208, 174], [255, 255, 255]], [[255, 255, 255], [236, 26, 101], [143, 87, 158], [64, 188, 199], [254, 208, 6]], [[255, 255, 255], [49, 160, 82], [252, 189, 2], [237, 66, 46], [62, 130, 247]], [[2, 61, 80], [233, 106, 84], [156, 137, 132], [198, 180, 176], [251, 252, 252]], [[253, 254, 255], [249, 211, 6], [47, 189, 199], [67, 104, 177], [53, 60, 75]], [[85, 15, 71], [93, 222, 181], [251, 235, 63], [252, 148, 51], [210, 33, 89]], [[53, 71, 143], [235, 65, 123], [244, 167, 43], [254, 255, 255], [33, 187, 212]], [[255, 255, 255], [252, 182, 4], [249, 133, 46], [252, 79, 30], [54, 169, 223]], [[171, 214, 41], [5, 28, 4], [145, 96, 57], [200, 160, 103], [249, 250, 248]], [[97, 21, 77], [85, 168, 186], [251, 248, 222], [253, 154, 66], [205, 82, 82]], [[255, 255, 255], [231, 50, 60], [25, 44, 67], [52, 125, 141], [109, 189, 205]], [[255, 255, 255], [2, 3, 3], [36, 94, 133], [143, 146, 149], [22, 183, 234]], [[118, 196, 255], [40, 76, 104], [201, 161, 114], [238, 236, 211], [235, 171, 208]], [[253, 203, 15], [38, 35, 34], [236, 115, 34], [250, 252, 251], [96, 196, 182]], [[253, 254, 254], [58, 198, 123], [51, 152, 170], [155, 87, 227], [248, 107, 74]], [[233, 236, 240], [93, 152, 210], [199, 154, 95], [175, 98, 61], [58, 32, 69]], [[255, 255, 255], [237, 75, 82], [89, 62, 83], [116, 123, 130], [98, 204, 189]], [[38, 87, 139], [210, 167, 15], [254, 235, 209], [251, 93, 58], [12, 12, 12]], [[75, 37, 28], [246, 174, 3], [183, 132, 23], [190, 175, 133], [104, 244, 157]], [[0, 0, 0], [253, 246, 134], [222, 194, 85], [151, 108, 32], [100, 58, 26]], [[245, 245, 245], [227, 227, 39], [77, 188, 188], [38, 38, 38], [236, 83, 107]], [[58, 58, 58], [75, 143, 61], [102, 186, 68], [251, 251, 251], [208, 28, 68]], [[246, 237, 224], [234, 150, 46], [226, 106, 123], [160, 102, 138], [73, 143, 149]], [[230, 78, 67], [65, 78, 88], [239, 239, 239], [227, 206, 170], [230, 180, 92]], [[128, 222, 234], [40, 1, 2], [222, 83, 75], [236, 203, 207], [249, 176, 66]], [[60, 202, 255], [48, 51, 6], [252, 56, 2], [253, 191, 2], [249, 252, 252]], [[31, 32, 37], [89, 82, 240], [175, 167, 209], [251, 251, 250], [253, 217, 96]], [[4, 2, 3], [251, 251, 251], [160, 159, 159], [224, 31, 113], [96, 51, 70]], [[253, 253, 253], [234, 66, 66], [242, 127, 43], [138, 204, 84], [84, 184, 239]], [[254, 254, 254], [5, 37, 52], [55, 80, 91], [24, 102, 243], [108, 149, 214]], [[242, 242, 242], [18, 225, 253], [25, 117, 254], [37, 44, 247], [10, 35, 67]], [[67, 33, 57], [245, 201, 59], [250, 247, 247], [234, 76, 137], [194, 33, 91]], [[55, 28, 32], [187, 62, 75], [233, 182, 46], [231, 220, 202], [123, 197, 199]], [[224, 141, 185], [45, 78, 79], [75, 128, 118], [85, 169, 139], [245, 238, 242]], [[5, 152, 135], [8, 11, 44], [231, 83, 116], [255, 135, 161], [240, 240, 242]], [[255, 139, 220], [24, 155, 247], [77, 16, 147], [250, 53, 18], [244, 221, 3]], [[255, 255, 255], [229, 71, 30], [34, 31, 24], [34, 151, 157], [243, 222, 19]], [[250, 246, 242], [255, 50, 106], [191, 45, 216], [121, 24, 249], [42, 198, 254]], [[77, 166, 124], [89, 51, 40], [231, 100, 55], [223, 199, 150], [250, 247, 240]], [[239, 198, 1], [105, 61, 82], [175, 34, 37], [222, 77, 28], [255, 255, 255]], [[22, 22, 20], [234, 94, 88], [253, 253, 253], [20, 166, 166], [50, 128, 127]], [[0, 87, 95], [254, 97, 54], [255, 255, 160], [117, 190, 145], [0, 165, 138]], [[44, 54, 56], [1, 135, 134], [3, 198, 175], [255, 255, 255], [246, 98, 98]], [[254, 212, 213], [251, 198, 46], [87, 200, 250], [48, 60, 166], [245, 87, 148]], [[0, 0, 0], [254, 53, 139], [17, 164, 224], [255, 255, 255], [173, 236, 1]], [[251, 252, 254], [24, 24, 24], [62, 10, 236], [51, 98, 255], [89, 172, 255]], [[1, 1, 1], [250, 199, 6], [229, 229, 230], [161, 160, 160], [96, 93, 86]], [[255, 255, 255], [1, 173, 239], [99, 100, 103], [183, 119, 109], [240, 229, 12]], [[0, 0, 0], [82, 145, 221], [244, 86, 67], [234, 182, 31], [56, 158, 83]], [[239, 251, 66], [255, 255, 255], [158, 180, 189], [62, 203, 223], [91, 119, 132]], [[42, 161, 104], [41, 50, 53], [82, 84, 70], [205, 124, 48], [250, 251, 251]], [[255, 255, 255], [232, 190, 30], [205, 38, 44], [59, 68, 95], [4, 4, 3]], [[249, 249, 247], [143, 183, 64], [74, 142, 60], [19, 101, 49], [13, 124, 134]], [[254, 255, 254], [160, 37, 43], [39, 44, 50], [8, 60, 95], [112, 128, 144]], [[255, 255, 255], [9, 157, 85], [244, 181, 12], [167, 82, 94], [70, 137, 242]], [[0, 157, 154], [85, 30, 53], [188, 61, 80], [236, 234, 232], [182, 201, 3]], [[144, 19, 254], [255, 240, 68], [22, 240, 217], [254, 254, 255], [254, 58, 173]], [[0, 0, 0], [47, 156, 197], [118, 65, 249], [251, 60, 68], [232, 206, 129]], [[255, 255, 255], [1, 1, 1], [253, 0, 169], [227, 74, 21], [1, 182, 244]], [[254, 254, 253], [12, 18, 9], [89, 79, 69], [152, 145, 143], [173, 135, 97]], [[248, 171, 127], [8, 3, 3], [119, 155, 74], [76, 187, 173], [236, 240, 237]], [[255, 255, 255], [42, 179, 197], [22, 128, 130], [144, 176, 83], [239, 99, 49]], [[254, 254, 254], [253, 204, 2], [89, 201, 190], [30, 110, 235], [248, 50, 76]], [[39, 39, 39], [233, 233, 233], [167, 166, 165], [167, 173, 85], [124, 132, 51]], [[1, 1, 1], [217, 210, 202], [253, 210, 94], [253, 155, 75], [253, 112, 74]], [[255, 255, 255], [216, 57, 44], [164, 54, 56], [101, 45, 66], [26, 28, 64]], [[255, 255, 255], [228, 25, 74], [238, 113, 34], [82, 126, 87], [27, 127, 194]], [[249, 249, 249], [234, 76, 137], [72, 67, 69], [5, 62, 252], [2, 170, 235]], [[251, 251, 251], [32, 24, 44], [8, 156, 254], [253, 105, 105], [247, 202, 73]], [[72, 196, 145], [1, 0, 0], [236, 31, 88], [255, 255, 255], [253, 211, 85]], [[23, 30, 46], [108, 196, 208], [255, 255, 255], [254, 182, 44], [238, 55, 105]], [[2, 12, 39], [244, 234, 155], [204, 165, 93], [151, 114, 64], [93, 80, 62]], [[254, 195, 2], [157, 203, 201], [253, 252, 252], [254, 102, 1], [62, 57, 80]], [[254, 253, 251], [243, 201, 72], [242, 163, 11], [85, 55, 32], [31, 16, 5]], [[237, 29, 88], [4, 4, 4], [190, 175, 177], [255, 255, 255], [89, 192, 142]], [[23, 20, 28], [242, 241, 241], [177, 172, 173], [128, 125, 129], [213, 27, 35]], [[253, 184, 19], [242, 89, 34], [203, 204, 206], [125, 127, 131], [54, 54, 56]], [[245, 245, 243], [197, 177, 86], [90, 175, 178], [188, 166, 216], [255, 120, 120]], [[246, 237, 216], [4, 4, 4], [115, 103, 92], [62, 141, 198], [234, 153, 151]], [[252, 232, 233], [37, 33, 31], [119, 93, 89], [151, 141, 137], [133, 204, 153]], [[240, 93, 79], [248, 176, 22], [139, 36, 26], [59, 51, 65], [17, 17, 38]], [[255, 255, 255], [4, 4, 4], [103, 92, 91], [248, 85, 80], [234, 143, 135]], [[242, 242, 242], [3, 3, 2], [114, 178, 247], [249, 125, 0], [254, 190, 0]], [[251, 250, 246], [242, 60, 139], [223, 154, 192], [241, 159, 121], [74, 180, 198]], [[255, 255, 255], [85, 188, 224], [197, 206, 67], [207, 88, 39], [87, 63, 35]], [[255, 255, 255], [3, 205, 236], [0, 166, 213], [0, 116, 162], [40, 40, 40]], [[246, 249, 251], [63, 159, 129], [26, 117, 185], [83, 87, 92], [40, 40, 40]], [[255, 86, 79], [250, 154, 30], [255, 230, 229], [37, 104, 239], [62, 77, 97]], [[186, 224, 245], [17, 12, 13], [22, 88, 45], [0, 131, 63], [58, 173, 42]], [[21, 165, 138], [250, 200, 40], [196, 219, 228], [253, 141, 134], [26, 48, 42]], [[255, 255, 255], [254, 69, 37], [22, 36, 63], [174, 90, 255], [26, 203, 240]], [[14, 36, 50], [183, 98, 103], [173, 162, 144], [240, 215, 174], [237, 160, 71]], [[41, 40, 40], [255, 255, 255], [172, 165, 166], [232, 76, 137], [193, 38, 99]], [[103, 176, 182], [233, 224, 206], [243, 177, 102], [229, 81, 69], [21, 17, 16]], [[254, 254, 254], [2, 0, 104], [13, 70, 248], [193, 173, 227], [249, 1, 102]], [[255, 255, 255], [224, 88, 46], [100, 91, 79], [32, 171, 111], [43, 167, 216]], [[246, 175, 31], [220, 70, 1], [65, 77, 65], [81, 128, 132], [242, 238, 230]], [[33, 29, 31], [87, 159, 211], [222, 233, 233], [248, 176, 50], [230, 70, 72]], [[47, 58, 66], [232, 227, 224], [255, 106, 0], [181, 89, 23], [110, 74, 49]], [[255, 255, 255], [32, 32, 33], [77, 74, 76], [229, 86, 90], [239, 179, 115]], [[255, 255, 255], [31, 30, 29], [229, 117, 95], [178, 181, 66], [115, 193, 194]], [[17, 255, 156], [20, 17, 174], [45, 105, 255], [1, 124, 106], [228, 251, 249]], [[255, 255, 255], [60, 130, 202], [7, 10, 14], [215, 18, 39], [253, 234, 16]], [[255, 242, 0], [36, 32, 32], [237, 31, 36], [242, 244, 242], [3, 175, 237]], [[254, 254, 254], [18, 8, 6], [122, 70, 27], [168, 102, 42], [127, 127, 129]], [[12, 12, 64], [66, 217, 211], [255, 255, 255], [219, 189, 164], [229, 106, 159]], [[255, 243, 255], [254, 148, 47], [251, 103, 92], [204, 21, 213], [119, 0, 254]], [[180, 217, 199], [62, 75, 91], [101, 87, 66], [164, 134, 92], [220, 190, 170]], [[172, 147, 166], [51, 16, 16], [205, 98, 63], [250, 136, 92], [252, 251, 250]], [[0, 0, 0], [2, 72, 108], [97, 106, 111], [1, 131, 190], [250, 251, 252]], [[249, 237, 243], [99, 113, 50], [115, 158, 92], [184, 209, 164], [196, 113, 172]], [[253, 253, 253], [245, 199, 16], [241, 108, 129], [229, 68, 64], [54, 52, 72]], [[255, 255, 255], [255, 206, 1], [8, 192, 235], [95, 93, 89], [248, 43, 73]], [[93, 93, 93], [225, 213, 195], [198, 166, 108], [188, 37, 50], [5, 5, 5]], [[33, 41, 62], [59, 184, 128], [213, 216, 218], [247, 183, 153], [227, 29, 87]], [[34, 44, 49], [102, 148, 116], [239, 237, 225], [241, 179, 84], [232, 124, 69]], [[171, 102, 105], [41, 35, 26], [150, 112, 10], [223, 184, 67], [224, 220, 212]], [[31, 57, 74], [84, 162, 94], [238, 238, 220], [199, 169, 168], [195, 126, 78]], [[242, 242, 242], [239, 91, 35], [150, 116, 72], [2, 142, 176], [0, 55, 92]], [[34, 28, 28], [186, 79, 97], [221, 122, 142], [247, 223, 210], [253, 249, 121]], [[43, 64, 170], [248, 163, 26], [225, 81, 66], [36, 32, 33], [20, 145, 71]], [[255, 255, 255], [63, 62, 60], [176, 33, 89], [230, 77, 137], [225, 159, 186]], [[255, 255, 255], [149, 194, 154], [249, 178, 97], [237, 101, 81], [57, 59, 85]], [[239, 240, 240], [48, 167, 75], [243, 183, 16], [219, 46, 52], [66, 133, 237]], [[6, 6, 7], [110, 75, 156], [129, 129, 80], [158, 197, 59], [253, 252, 252]], [[19, 23, 27], [137, 176, 194], [242, 246, 249], [234, 175, 165], [249, 207, 24]], [[250, 250, 250], [209, 59, 250], [113, 110, 242], [88, 194, 238], [8, 249, 229]], [[242, 244, 241], [106, 237, 106], [241, 171, 111], [185, 114, 219], [2, 1, 2]], [[255, 255, 255], [94, 181, 178], [252, 196, 65], [221, 71, 54], [221, 91, 142]], [[251, 239, 240], [252, 150, 16], [240, 96, 2], [167, 62, 44], [99, 36, 39]], [[35, 34, 34], [89, 48, 115], [154, 52, 159], [105, 85, 178], [53, 101, 174]], [[255, 255, 255], [169, 49, 5], [217, 74, 34], [253, 167, 141], [85, 150, 115]], [[2, 40, 38], [3, 186, 197], [246, 243, 237], [238, 91, 64], [48, 18, 12]], [[245, 245, 238], [60, 218, 148], [39, 109, 227], [61, 72, 110], [247, 108, 67]], [[255, 255, 255], [48, 48, 131], [170, 159, 242], [250, 93, 146], [252, 213, 109]], [[51, 188, 255], [244, 245, 246], [110, 77, 103], [29, 73, 95], [3, 8, 10]], [[255, 255, 255], [2, 29, 67], [77, 172, 236], [237, 106, 103], [246, 234, 58]], [[3, 3, 3], [112, 224, 194], [249, 250, 249], [244, 237, 108], [169, 161, 93]], [[255, 255, 255], [255, 10, 94], [131, 10, 94], [51, 29, 32], [2, 163, 225]], [[255, 255, 255], [196, 35, 141], [80, 46, 117], [59, 150, 212], [215, 189, 39]], [[254, 253, 229], [248, 185, 52], [51, 180, 138], [38, 52, 42], [162, 47, 25]], [[250, 242, 221], [15, 166, 200], [221, 166, 52], [199, 6, 48], [10, 28, 64]], [[255, 255, 255], [255, 217, 0], [249, 168, 12], [240, 94, 12], [94, 62, 47]], [[211, 167, 176], [160, 28, 32], [87, 47, 46], [38, 40, 42], [113, 128, 108]], [[255, 79, 129], [255, 241, 1], [255, 255, 255], [0, 102, 236], [47, 39, 45]], [[255, 156, 4], [212, 220, 253], [255, 255, 254], [124, 78, 7], [19, 30, 72]]];
