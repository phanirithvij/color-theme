# A simple showcase of image based color theme

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