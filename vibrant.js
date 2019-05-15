/* Node vibrant js */

/* https://github.com/akfish/node-vibrant/ */

var VibrantJS = require('node-vibrant')

const path = require('path')

const default_p = path.resolve("src/server/img/infile.png")
let passed_p;

if (process.argv.length > 2){
    passed_p = path.resolve(process.argv[2])
}

const varToString = varObj => Object.keys(varObj)[0]

// Using constructor
let v = new VibrantJS(passed_p || default_p, {})
// Promise
v.getPalette().then((palette) => {
    const Vibrant = palette.Vibrant.hex
    const DarkVibrant = palette.DarkVibrant.hex
    const LightVibrant = palette.LightVibrant.hex
    const Muted = palette.Muted.hex
    const DarkMuted = palette.DarkMuted.hex
    const LightMuted = palette.LightMuted.hex
    // console.log(`${palette.Vibrant.hex} ${palette.DarkVibrant.hex} ${palette.LightVibrant.hex} ${palette.Muted.hex} ${palette.DarkMuted.hex} ${palette.LightMuted.hex}`)
    const vb = {
        vibrant_name : varToString({Vibrant}),
        hex : Vibrant
    }
    const dvb = {
        vibrant_name : varToString({DarkVibrant}),
        hex : DarkVibrant
    }
    const lvb = {
        vibrant_name : varToString({LightVibrant}),
        hex : LightVibrant
    }
    const mu = {
        vibrant_name : varToString({Muted}),
        hex : Muted
    }
    const dmu = {
        vibrant_name : varToString({DarkMuted}),
        hex : DarkMuted
    }
    const lmu = {
        vibrant_name : varToString({LightMuted}),
        hex : LightMuted
    }

    var AA = [vb, dvb, lvb, mu, dmu, lmu]
    console.log(JSON.stringify(AA))
})
