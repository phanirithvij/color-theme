/* Node vibrant js */

/* https://github.com/akfish/node-vibrant/ */

var Vibrant = require('node-vibrant')

const path = require('path')

const default_p = path.resolve("src/server/img/infile.jpg")
let passed_p;

if (process.argv.length > 2){
    passed_p = path.resolve(process.argv[2])
}

function hexToRgb (hex) {
    let m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    if (!m) throw new RangeError(`'${hex}' is not a valid hex color`)

    return [m[1], m[2], m[3]].map((s) => parseInt(s, 16))
}

function rgbToHex (r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1, 7)
}

// Using constructor
let v = new Vibrant(passed_p || default_p, {})
// Promise
v.getPalette().then((palette) => {
    console.log(`${palette.Vibrant.hex} ${palette.DarkVibrant.hex} ${palette.LightVibrant.hex} ${palette.Muted.hex} ${palette.DarkMuted.hex} ${palette.LightMuted.hex}`)
})
