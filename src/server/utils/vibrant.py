import json
import os
import subprocess

from server.utils.names import get_names_knn

VIBRANT_JS = os.path.abspath("server/scripts/vibrant.js")


# TODO remove this not using ntc.js anymore
# using kmeans to get the color names
def get_vibrants_node(image_path):
    print("PWD1", os.getcwd())
    os.chdir("..")
    print("PWD2", os.getcwd())
    image_path = os.path.abspath(image_path)
    cmd = "node", VIBRANT_JS, image_path
    resp = subprocess.check_output(cmd)
    os.chdir("src")
    print("PWD3", os.getcwd())
    dataP = json.loads(resp)
    hexes = [x['hex'] for x in dataP]
    respS = get_names_knn(hexes)
    for temp_, x in zip(respS, dataP):
        temp_["vibrant_name"] = x["vibrant_name"]
    return respS


def get_vibrants(image_path):
    image_path = os.path.abspath(image_path)
    # TODO some kind of bug because of celery or Flask?
    # remove this quickfix later
    if not os.getcwd().endswith("src"):
        os.chdir("src")
    cmd = "./server/scripts/scripts", image_path
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
    # i.e. from names import get_names
    print(
        get_vibrants(
            "D:/Images/Wallpapers/no-man-s-sky-wallpaper-8k-110377.jpg"
        )
    )
