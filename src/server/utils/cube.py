from PIL import Image

from .ColorCube import ColorCube
from .colors import *
from .names import get_names

def get_colors_cube(path: str):
    cc = ColorCube()

    # Load image and scale down to make the algorithm faster.
    # Scaling down also gives colors that are more dominant in perception.
    image = Image.open(path).resize((100, 100))

    # Get colors for that image
    colors = cc.get_colors(image)

    # Print first ten colors (there might be much more)
    colors = [rgb2hex(tuple(x)) for x in colors]

    return get_names(colors)
