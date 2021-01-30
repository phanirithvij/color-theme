import json
import os
import subprocess

from server.utils.names import get_names_knn

GET_IMAGE_COLORS_JS = os.path.abspath("server/scripts/get-image-colors.js")


def get_colors_image_js(image_path):
    print(image_path)
    image_path = os.path.abspath(image_path)
    cmd = "node", "-r", "esm", GET_IMAGE_COLORS_JS, image_path
    resp = subprocess.check_output(cmd)
    print("***" * 21)
    print(resp)
    dataP = json.loads(resp)
    temps = get_names_knn(dataP)
    print(temps)
    print("***" * 21)
    return temps
