from PIL import Image

from server.utils.ColorCube import ColorCube
from server.utils.colors import rgb2hex
from server.utils.names import get_names_knn

def get_colors_cube(path: str):
    cc = ColorCube()

    # Load image and scale down to make the algorithm faster.
    # Scaling down also gives colors that are more dominant in perception.
    image = Image.open(path).resize((100, 100))

    # Get colors for that image
    colors = cc.get_colors(image)

    # Print first ten colors (there might be much more)
    colors = [rgb2hex(tuple(x)) for x in colors]

    return get_names_knn(colors)
