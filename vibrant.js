/* Node vibrant js */

/* https://github.com/akfish/node-vibrant/ */

var Vibrant = require('node-vibrant')

// Using constructor
let v = new Vibrant('infile.jpg', {})
// Promise
v.getPalette().then((palette) => console.log(palette))
