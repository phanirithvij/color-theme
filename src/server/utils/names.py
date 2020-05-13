import os
import subprocess
import json

from server.utils.knn import Knn
from server.utils.colors import hex2rgb, rgb2hex

NTC_PATH = os.path.abspath("server/scripts/ntc.js")
# print(NTC_PATH)

MODELS = [
    Knn("server/data/ntc.csv"),
    Knn("server/data/xkcd.csv"),
    Knn("server/data/wikipedia_color_names.csv"),
    Knn("server/data/resene.csv"),
]


def get_names(colors: list):
    colors_a = ""
    # print(colors)
    for x in colors:
        colors_a += " \"" + x + "\""
    print(f"[names] node \"{NTC_PATH}\" {colors_a}")
    data = subprocess.check_output(f"node \"{NTC_PATH}\" {colors_a}")
    dataP = json.loads(data)
    return dataP


def get_names_knn(colors: list):
    """
    eg:
        exact: false
        hex: "#b7d0ba"
        names: ["Gum Leaf"]
        similar_color: "#B6D3BF"
    """
    entries = []
    for color in colors:
        r, g, b = hex2rgb(color)
        names = []
        hexes = []
        exact = []
        for model in MODELS:
            name, er, eg, eb = model.get_color_name(r, g, b)
            names.append(name)
            hexv = rgb2hex((er, eg, eb))
            hexes.append(hexv)
            exact.append(hexv == color)
        entries.append({
            'hex': color,
            'names': names,
            'similar_colors': hexes,
            'exact': exact,
        })
    return entries


if __name__ == "__main__":
    print(get_names(["#000000", "#d4d4aa", "#ffffff"]))
    print(get_names_knn(["#000000", "#d4d4aa", "#ffffff"]))
