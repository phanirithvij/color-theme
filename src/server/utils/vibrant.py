import json
import os
import subprocess
import sys

from server.utils.names import get_names_knn

VIBRANT_JS = os.path.abspath("server/scripts/vibrant.js")
THUMB_FOLDER = "server/img/thumbs/"

def get_vibrants_node(image_path):
    image_path = os.path.join(THUMB_FOLDER, os.path.basename(image_path))
    image_path = os.path.abspath(image_path)
    print("[WARNING] node-vibrant uses @jimp which sucks")
    print("So using thumbnail for getting colors", image_path)
    cmd = "node", VIBRANT_JS, image_path
    resp = subprocess.check_output(cmd)
    print(resp)
    dataP = json.loads(resp)
    hexes = [x['hex'] for x in dataP]
    respS = get_names_knn(hexes)
    for temp_, x in zip(respS, dataP):
        temp_["vibrant_name"] = x["vibrant_name"]
    return respS


def get_vibrants(image_path):
    image_path = os.path.abspath(image_path)
    # TODO some kind of bug because of Flask
    # remove this quickfix later
    print("PWD1", os.getcwd(), sys.argv[0])
    if not os.getcwd().endswith("src"):
        os.chdir("src")
    # TODO check if windows and execute .exe file
    exe = "server/scripts/scripts" 
    if sys.platform == "win32":
        exe += ".exe"
    cmd = exe, image_path
    resp = subprocess.check_output(cmd)
    print("..." * 21)
    dataP = json.loads(resp)
    hexs = []
    for x in dataP:
        hex_ = x["hex"]
        hexs.append(hex_)
    temps = get_names_knn(hexs)
    for temp_, x in zip(temps, dataP):
        temp_["vibrant_name"] = x["vibrant_name"]

    return temps


if __name__ == "__main__":
    # make the import "names" from ".names"
    # i.e. from names import get_names_ntc
    print(
        get_vibrants(
            "D:/Images/Wallpapers/no-man-s-sky-wallpaper-8k-110377.jpg"
        )
    )
