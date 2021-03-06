import json
import os
import subprocess


from server.utils.names import get_names_knn

RGBASTER_JS = os.path.abspath("server/scripts/rgbaster.js")


def get_baster_colors(image_path):
    image_path = os.path.abspath(image_path)
    cmd = "node", RGBASTER_JS, image_path
    resp = subprocess.check_output(cmd)
    # print(resp)
    dataP = json.loads(resp)
    hexs = []
    for x in dataP:
        hex_ = x["hex"]
        hexs.append(hex_)
    temps = get_names_knn(hexs)
    for temp_, x in zip(temps, dataP):
        temp_["count"] = x["count"]

    print(temps)
    return temps
