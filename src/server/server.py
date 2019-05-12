import os
import uuid
import sqlite3

from flask import Flask, request, jsonify
from flask import send_file, send_from_directory, render_template
from flask_cors import CORS, cross_origin

from utils.gencss import gen_css
from utils import get_colors
from configs.db import init_db
from configs import JOINER as joiner

app = Flask(__name__)
CORS(app)

conn = sqlite3.connect(os.path.abspath("src/server/tmp/database.db"))
cur  = conn.cursor()

app.static_folder = app.root_path + "/public"

@app.route('/colors/<filename>')
@cross_origin()
def getcolors(filename:str):
    print(request.args)
    file = os.path.abspath(f"src/server/img/{filename}")
    colors = (get_colors(file))
    data = {
        "main"      : colors[0],
        "palette"   : colors[1]
    }
    return jsonify(data)

@app.route('/colorcss/<filename>/style.css')
@cross_origin()
def getcolorCss(filename:str):
    print(request.args)
    file_exists = False
    css_file = None

    if not file_exists:
        file = os.path.abspath(f"src/server/img/{filename}")
        colors = (get_colors(file))
        # data = {"main":colors[0], "palette":colors[1]}
        dataS = gen_css(colors)
        temp_dir = os.path.abspath('src/server/tmp/')
        uid = uuid.uuid1()

        temp_file = os.path.join(temp_dir, f"{filename}{joiner}{uid}.css")

        with open(temp_file, "w+") as cssfile:
            cssfile.write(dataS)
        css_file = temp_file

        # insert to db

    return send_file(css_file) # send a freshly created css file

@app.route('/image/<filename>')
@cross_origin()
def getimage(filename:str):
    print(request.args)
    file = os.path.abspath(f"src/server/img/{filename}")
    return send_file(file)

@app.route('/')
@cross_origin()
def gethome():
    return render_template("index.html")

if __name__ == "__main__":
    init_db(conn, cur)
    app.run(debug=True, port=5000)
