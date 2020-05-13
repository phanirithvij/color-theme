// https://github.com/colorjs/get-image-colors
import {
    resolve
} from 'path';
import getColors from 'get-image-colors';

const options = {
    count: 10
}

var rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}


getColors(resolve(process.argv[2]), options).then(colors => {
    // `colors` is an array of color objects
    const hexs = [];
    for (var color of colors) {
        var [r, g, b, _] = color._rgb;
        hexs.push(rgbToHex(r, g, b));
    }
    console.log(JSON.stringify(hexs));
});
