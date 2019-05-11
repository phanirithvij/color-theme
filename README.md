# A simple showcase of a image based color theme

## Setup

> Python > 3.6

> Node Js > 10.0.0

Python Dependencies

```shell
pip install Pillow colorthief flask
```

Npm setup
```shell
npm i
```

### Note

To change `:root` vars in css through js 

```javascript
document.documentElement.style.setProperty('--your-variable', '#YOURCOLOR');
```

### FFMPEG Gen Thumbs
```shell
ffmpeg -ss 3 -i /d/Videos/TVSHOWS/Gintama/Gintama_Season_7_Episode_345.mp4 -vf "select=gt(scene\,0.4)" -frames:v 100 -vsync vfr -vf fps=fps=1/6 out%003d.jpg
```

Taken from [here](https://askubuntu.com/questions/377579/ffmpeg-output-screenshot-gallery)

```shell
ffmpeg -i /d/Videos/TVSHOWS/Gintama/Gintama_Season_8_Episode_367_HorribleSubs.mkv -vf "select='gt(scene,0.4)',scale=120:-1,tile=layout=10x10" -frames:v 1 -qscale:v 2 output.jpg
```

ImageMagick [here](http://www.imagemagick.org/Usage/montage/)

```shell
montage out*.jpg -resize 180x320 -tile 10x10 -geometry +0+0 montage.jpg
```

Found three ways of extracting colors from images.

Found [here](http://palette.site/)

email : phanirithvij2000@gmail.com
pwd:    stdGUQ8JWz28SKc
api_key : 1a3d575520ff2130aba23a88f09b2c28

+ Builds 3D histogram grid, searches for local maxima of the hit count
    
    [https://github.com/pixelogik/ColorCube](https://github.com/pixelogik/ColorCube)

    File: `ColorCube.py`
+ Based on Palette class from Android SDK

    [https://github.com/akfish/node-vibrant/](https://github.com/akfish/node-vibrant/)
    
    File : `vibrant.js`
+ Clusters similar colors in 3D model, sort them by volume and returns base colors for each block

    [https://github.com/lokesh/color-thief](https://github.com/lokesh/color-thief)

    File: `rgbaster.js`
