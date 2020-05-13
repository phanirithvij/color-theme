const {
  createCanvas,
  loadImage
} = require('canvas')

var getContext = function (width, height) {
  var canvas = createCanvas(width, height);
  return canvas.getContext('2d');
};

var getImageData = function (src, scale) {
  if (scale === void 0) scale = 1;

  return loadImage(src).then((img) => {
    var width = img.width * scale;
    var height = img.height * scale;
    var context = getContext(width, height);
    context.drawImage(img, 0, 0, width, height);
    var ref = context.getImageData(0, 0, width, height);
    var data = ref.data;
    return data;
  });
};

var getCounts = function (data, ignore) {
  var countMap = {};

  for (var i = 0; i < data.length; i += 4) {
    var alpha = data[i + 3];
    if (alpha === 0) {
      continue;
    }
    var rgbComponents = Array.from(data.subarray(i, i + 3));
    if (rgbComponents.indexOf(undefined) !== -1) {
      continue;
    }
    var color = alpha && alpha !== 255 ? ("rgba(" + (rgbComponents.concat([alpha]).join(',')) + ")") : ("rgb(" + (rgbComponents.join(',')) + ")");
    if (ignore.indexOf(color) !== -1) {
      continue;
    }

    if (countMap[color]) {
      countMap[color].count++;
    } else {
      countMap[color] = {
        color: color,
        count: 1
      };
    }
  }

  var counts = Object.values(countMap);
  return counts.sort(function (a, b) {
    return b.count - a.count;
  }).map(c => ({
    hex: rgbToHex(
      ...c.color
      .replace(/\(|\)|[rgb]/g, '')
      .split(',')
      .map(col => parseInt(col))
    ),
    count: c.count,
  }));
};

var defaultOpts = {
  ignore: [],
  scale: 0.3
};
var index = (function (src, opts) {
  if (opts === void 0) opts = defaultOpts;

  try {
    opts = Object.assign({}, defaultOpts,
      opts);
    var ignore = opts.ignore;
    var scale = opts.scale;

    if (scale > 1 || scale <= 0) {
      console.warn(("You set scale to " + scale + ", which isn't between 0-1. This is either pointless (> 1) or a no-op (≤ 0)"));
    }

    return Promise.resolve(getImageData(src, scale)).then(function (data) {
      return getCounts(data, ignore);
    });
  } catch (e) {
    return Promise.reject(e);
  }
});

function rgbToHex(r, g, b) {
  // console.log(r, g, b);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

module.exports = index;