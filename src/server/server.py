from utils import get_colors
import os

from flask import Flask, request, jsonify, send_file, render_template

app = Flask(__name__)
app.static_folder = app.root_path + "/public"

@app.route('/colors/<filename>/')
def getcolors(filename:str):
    print(request.args)
    file = os.path.abspath(f"src/server/{filename}")
    colors = (get_colors(file))
    data = {"main":colors[0], "palette":colors[1]}
    return jsonify(data)

@app.route('/colorcss/<filename>/style.css')
def getcolorCss(filename:str):
    print(request.args)
    file = os.path.abspath(f"src/server/{filename}")
    colors = (get_colors(file))
    # data = {"main":colors[0], "palette":colors[1]}
    colorstrings = f"--bg-color : rgb({colors[0][0]},{colors[0][1]},{colors[0][2]});{os.linesep}"
    for i,col in enumerate(colors[1]):
        colorstrings += f"--color-{i} : rgb({col[0]},{col[1]},{col[2]});{os.linesep}"
    print(colorstrings)
    dataS = f"""\
        :root {os.linesep}{
            {colorstrings}
        }
    """
    print(os.linesep)
    with open('src/server/tmp/sy.css', "w+") as cssfile:
        cssfile.write(dataS)
    return send_file(os.path.abspath("src/server/tmp/sy.css"), mimetype="text/css") # send a freshly created css file

@app.route('/image/<filename>/')
def getimage(filename:str):
    print(request.args)
    file = os.path.abspath(f"src/server/{filename}")
    return send_file(file)

@app.route('/')
def gethome():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
