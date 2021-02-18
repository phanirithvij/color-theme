# A simple showcase of a image based color theme

## Setup

### Requirements

- Golang
- Python 3
- Node js

### Client

```shell
# clone and cd to project root
npm i
npm run prod:client
```

### Server

```shell
# cd to project root
cd src
# linux and mac (tested only on linux)
sh start-server.sh

# on windows
.\start-server.bat
```

## Prometheus config


## Kubernetes config

- Guide https://www.youtube.com/watch?v=X48VuDVv0do&t=2087s
- On windows only VirtualBox works https://minikube.sigs.k8s.io/docs/drivers/virtualbox/#usage
- VirtualBox issue on my pc https://stackoverflow.com/a/57484375/8608146
  - disable and enable

## TODO

- [ ] Try rewriting in golang totally
- [ ] React/Vue client? Can learn vue
- [ ] Flutter app, flutter web(?)
- [ ] adobe.js in golang (?)
  - [ ] Client side is better because no server side processing is required
  - but unfortunately code is exposed
- [ ] Recreate the thing from color palette extraction from the coolors website
  - try https://github.com/dchevell/flask-executor
- [ ] Downsample image and save thumbnail before extracting colors
  - [x] Partially implemented, Planned for pure golang release
- [ ] Deal with spaces in uploaded file names. Try not to have a db for the initial version. Long term store original file name, generated filename in db.
- [ ] Try catch for individual methods. And log to a separate file, store that failed image in a separate directory.
      Sample image `/home/rithvij/Desktop/Temp/wp2831915-black-background-png.png` from `https://img.pngio.com/black-background-png-wallpaper-cave-pretty-black-background-png-1920_1080.png`
  - [ ] vibrant.go doesn't support ico format for eg.
- [ ] Implement alternative to celery bgtasks using golang and update the clients of their image color extraction progress

### Note

To change `:root` vars in css through js

```javascript
document.documentElement.style.setProperty("--your-variable", "#YOURCOLOR");
```

### FFMPEG Gen Thumbs

These are extremely slow

```shell
ffmpeg -ss 3 -i /d/Videos/TVSHOWS/Gintama/Gintama_Season_7_Episode_345.mp4 -vf "select=gt(scene\,0.4)" -frames:v 100 -vsync vfr -vf fps=fps=1/6 out%003d.jpg
```

Taken from [here](https://askubuntu.com/questions/377579/ffmpeg-output-screenshot-gallery)

```shell
ffmpeg -i /d/Videos/TVSHOWS/Gintama/Gintama_Season_8_Episode_367_HorribleSubs.mkv -vf "select='gt(scene,0.4)',scale=120:-1,tile=layout=10x10" -frames:v 1 -qscale:v 2 output.jpg
```

**Updated**

Taken from [here](https://superuser.com/a/821680/1049709)

Use a for loop for number of frames times

```
ffmpeg -ss <T> -i <movie>
   -vf select="eq(pict_type\,I)" -vframes 1 image<X>.jpg
```

```shell
# each command will look like this:
ffmpeg -ss 1:38:36.708297 -i D:\\Videos\\MOVIES\\Sonic\\Sonic.The.Hedgehog.2020.1080p.WEBRip.x264.AAC-[YTS.MX].mp4 -filter_complex [0]select=eq(pict_type\,I)[s0];[s0]scale=160:-2[s1] -map [s1] -vframes 1 tmp/sonic099.jpg -loglevel quiet -y
```

Implementation is in [`ff.py`](ff.py)

ImageMagick [here](http://www.imagemagick.org/Usage/montage/)

```shell
# montage out*.jpg -resize 180x320 -tile 10x10 -geometry +0+0 montage.jpg
montage tmp/sonic*.jpg -tile 10x10 -geometry +0+0 tmp/montagesonic.jpg
```

Found three ways of extracting colors from images.

Found [here](http://palette.site/)

email : phanirithvij2000@gmail.com
pwd: ...@123

<!-- api_key : 1a3d575520ff2130aba23a88f09b2c28 -->

- Builds 3D histogram grid, searches for local maxima of the hit count

  [https://github.com/pixelogik/ColorCube](https://github.com/pixelogik/ColorCube)

  File: `ColorCube.py`

- Based on Palette class from Android SDK

  [https://github.com/akfish/node-vibrant/](https://github.com/akfish/node-vibrant/)

  File : `vibrant.js`

- Clusters similar colors in 3D model, sort them by volume and returns base colors for each block

  [https://github.com/lokesh/color-thief](https://github.com/lokesh/color-thief)

- Rgbaster from [https://github.com/briangonzalez/rgbaster.js](https://github.com/briangonzalez/rgbaster.js)
  File: `rgbaster.js`
