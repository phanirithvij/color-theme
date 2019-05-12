import os

def gen_css(colors):
    colorstrings = f"--bg-color : rgb({colors[0][0]},{colors[0][1]},{colors[0][2]});{os.linesep}"
    for i, col in enumerate(colors[1]):
        colorstrings += f"--color-{i} : rgb({col[0]},{col[1]},{col[2]});{os.linesep}"
    print(colorstrings)
    dataS = ":root{" + colorstrings + "}"
    return dataS
