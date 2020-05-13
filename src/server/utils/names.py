import os
import subprocess
import json

NTC_PATH = os.path.abspath("./ntc.js")

def get_names(colors: list):
    colors_a = ""
    # print(colors)
    for x in colors:
        colors_a += " \"" + x + "\""
    print(f"[names] node \"{NTC_PATH}\" {colors_a}")
    data = subprocess.check_output(f"node \"{NTC_PATH}\" {colors_a}")
    dataP = json.loads(data)
    return dataP

if __name__ == "__main__":
    get_names(["#000000", "#d4d4aa", "#ffffff"])
