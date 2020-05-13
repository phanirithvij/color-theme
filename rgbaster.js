/* RGBaster.js */

/* npm install --save rgbaster */

// https://github.com/briangonzalez/rgbaster.js

/* Used by https://github.com/briangonzalez/jquery.adaptive-backgrounds.js */

const analyze = require('./rgbaster.main');
const path = require('path');

(async ()=>{
    if (process.argv.length > 2){
        passed_p = path.resolve(process.argv[2]);
        const resl = await analyze(passed_p);
        console.log(JSON.stringify(resl.slice(0, 10)));
    } else {
        console.log("intentional invalid json sent because invalid usage")
    }
})();
