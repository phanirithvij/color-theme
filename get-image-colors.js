const path = require('path')
const getColors = require('get-image-colors')

const options = {
    count: 10
}

getColors(path.resolve(process.argv[2]), options).then(colors => {
    // `colors` is an array of color objects
    console.log(colors[0]);
});
