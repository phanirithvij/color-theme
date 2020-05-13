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