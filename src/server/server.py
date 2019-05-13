import os
import uuid
# import sqlite3

from flask import Flask, request, jsonify
from flask import send_file, render_template
from flask_cors import CORS, cross_origin

from utils.gencss import gen_css
from utils import get_colors
from configs.db import init_db, insert_pair, get_existing
from configs import JOINER as joiner
from configs import NO_SUCH_IMAGE

app = Flask(__name__)
CORS(app)

app.static_folder = app.root_path + "/public"

@app.route('/colors/<filename>/data.json')
@cross_origin()
def getcolors(filename: str):
    print(request.args)
    file = os.path.abspath(f"src/server/img/{filename}")
    colors = (get_colors(file))
    data = {
        "main": colors[0],
        "palette": colors[1]
    }
    return jsonify(data)

@app.route('/colorcss/<filename>/style.css')
@cross_origin()
def getcolorCss(filename: str):
    print(request.args)
    file_exists = False
    css_file = None
    temp_dir = os.path.abspath('src/server/tmp/')
    image_dir = os.path.abspath("src/server/img/")

    file_act_path = os.path.abspath(os.path.join(image_dir, filename))

    if not os.path.isfile(file_act_path):
        print(f"[server.py:getcolorCss] > {filename} is inexistent")
        return send_file(os.path.abspath("src/server/public/css/404.css"))

    exist = get_existing(filename)
    if exist and exist[0]:
        col = exist[0]
        css_file = f"{col[0]}{joiner}{col[1]}.css"
        css_file = os.path.join(temp_dir, css_file)
        print(css_file, "is the css file from db")
        file_exists = True

    if not file_exists:
        file = os.path.abspath(f"src/server/img/{filename}")
        colors = (get_colors(file))
        # data = {"main":colors[0], "palette":colors[1]}
        dataS = gen_css(colors)
        uid = uuid.uuid1()

        temp_file = os.path.join(temp_dir, f"{filename}{joiner}{uid}.css")

        with open(temp_file, "w+") as cssfile:
            cssfile.write(dataS)
        css_file = temp_file

        # insert to db
        insert_pair(filename, uid)

    return send_file(css_file)  # send a freshly created css file

@app.route('/image/<filename>')
@cross_origin()
def getimage(filename: str):
    print(request.args)
    file = os.path.abspath(f"src/server/img/{filename}")
    if os.path.isfile(file):
        return send_file(file)

    return NO_SUCH_IMAGE.format(filename), 404

@app.route('/')
def gethome():
    return render_template("index.html")

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
