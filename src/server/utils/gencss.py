import os
import uuid

from . import get_colors

def gen_css(colors):
    colorstrings = f"""
    --bg-color : rgb({colors[0][0]},{colors[0][1]},{colors[0][2]});
    """
    for i, col in enumerate(colors[1]):
        colorstrings += f"""
        --color-{i} : rgb({col[0]},{col[1]},{col[2]});
        """
    print(colorstrings)
    dataS = ":root{" + colorstrings + "}"
    return dataS

def get_colors_gen_css(filename: str, joiner: str, ex_colors=[], ex_uid=None):
    """
    Pass filename, joiner, existing_colors, existing_uid
    """
    temp_dir = os.path.abspath('src/server/tmp/')

    file = os.path.abspath(f"src/server/img/{filename}")
    colors = []

    if not ex_colors:
        colors = get_colors(file)
    else:
        # to convert it to the format gen_css uses
        colors = (ex_colors[0], ex_colors)

    dataS = gen_css(colors)
    uid = ex_uid
    if not ex_uid:
        uid = uuid.uuid1()

    temp_file = os.path.join(temp_dir, f"{filename}{joiner}{uid}.css")

    with open(temp_file, "w+") as cssfile:
        cssfile.write(dataS)
    css_file = temp_file

    return uid, colors, css_file
