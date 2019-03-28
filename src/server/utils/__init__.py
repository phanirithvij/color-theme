from PIL import Image, ImageDraw
from colorthief import ColorThief

def get_colors(infile, numcolors=10) -> (tuple, list):
    """returns (maincolor, colorlist)"""
    if numcolors < 2:
        numcolors = 2

    colort = ColorThief(infile)
    colors = colort.get_palette(color_count=numcolors)
    maincol = colort.get_color()
    if (len(colors) != numcolors):
        colors = colort.get_palette(color_count=numcolors+1)

    return (maincol, colors)

if __name__ == '__main__':
    print(get_colors('../infile.jpg', 10))
