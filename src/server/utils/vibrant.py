import json
import os
import subprocess

from .names import get_names

VIBRANT_JS = os.path.abspath("./vibrant.js")


def get_vibrants_node(image_path):
    image_path = os.path.abspath(image_path)
    cmd = f"node \"{VIBRANT_JS}\" \"{image_path}\""
    resp = subprocess.check_output(cmd)
    dataP = json.loads(resp)
    respS = []
    for x in dataP:
        hex_ = x["hex"]
        temp_ = get_names([f"\"{hex_}\""])[0]
        temp_["vibrant_name"] = x["vibrant_name"]
        respS.append(temp_)
    return respS


def get_vibrants(image_path):
    image_path = os.path.abspath(image_path)
    cmd = f".\\src\\server\\scripts\\scripts \"{image_path}\""
    resp = subprocess.check_output(cmd)
    print("..." * 21)
    dataP = json.loads(resp)
    hexs = []
    for x in dataP:
        hex_ = x["hex"]
        hexs.append(hex_)
    temps = get_names(hexs)
    for temp_, x in zip(temps, dataP):
        temp_["vibrant_name"] = x["vibrant_name"]

    return temps


if __name__ == "__main__":
    # make the import "names" from ".names"
    # i.e. from names import get_names
    print(
        get_vibrants(
            "D:/Images/Wallpapers/no-man-s-sky-wallpaper-8k-110377.jpg"
        )
    )
