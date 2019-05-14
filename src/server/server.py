import os
import json
# import uuid
# import sqlite3

from flask import Flask, request, jsonify
from flask import send_file, render_template
from flask_cors import CORS, cross_origin

# from utils.gencss import gen_css
from utils import get_colors
from utils.gencss import get_colors_gen_css
from utils.colors import hex2rgb

from configs.db import init_db
from configs.db import insert_pair, insert_file_colors
from configs.db import get_existing, get_existing_colors

from configs import JOINER as joiner
from configs import NO_SUCH_IMAGE

app = Flask(__name__)
cors = CORS(app)

app.static_folder = app.root_path + "/public"

@app.route('/colors/<filename>/data.json', methods=['GET'])
@cross_origin()
def getcolors(filename: str):
    init_db()
    print(request.args)
    file = os.path.abspath(f"src/server/img/{filename}")
    data = {}
    if not os.path.isfile(file):
        return jsonify({
            "error": 404,
            "message": f"No such file {filename}"
        }), 404

    # get from db
    colors = get_existing_colors(filename)
    if colors and len(colors):
        data = {
            "main": colors[0],
            "palette": colors
        }
    else:
        ex_colors = get_colors(file)
        data = {
            "main": ex_colors[0],
            "palette": ex_colors[1]
        }
        exist_css = get_existing(filename)
        if not exist_css:
            uid, colors, css_file = get_colors_gen_css(filename, joiner)
            # insert to css_table in db
            insert_pair(filename, uid)
        insert_file_colors(filename, ex_colors[1])
    return jsonify(data)

@app.route('/colorcss/<filename>/style.css', methods=['GET'])
@cross_origin()
def getcolorCss(filename: str):
    init_db()
    print(request.args)
    css_file_exists = False
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
        if os.path.isfile(css_file):
            # smooth case
            css_file_exists = True
        else:
            # css file was deleted on the server_side
            # generate again from existing colors but do not save to db
            ex_colors_hex = get_existing_colors(filename)

            ex_colors_rgb = [hex2rgb(x[1]) for x in ex_colors_hex]

            uid_ = col[1]
            get_colors_gen_css(
                filename,
                joiner,
                ex_colors=ex_colors_rgb,
                ex_uid=uid_
            )
            # now it exists
            css_file_exists = True

    if not css_file_exists:
        uid, colors, css_file = get_colors_gen_css(filename, joiner)
        # insert to css_table in db
        insert_pair(filename, uid)
    if not get_existing_colors(filename):
        insert_file_colors(filename, colors[1])

    return send_file(css_file)  # send a freshly created css file

@app.route('/image/<filename>', methods=['GET'])
@cross_origin()
def getimage(filename: str):
    init_db()
    print(request.args)
    file = os.path.abspath(f"src/server/img/{filename}")

    if not os.path.isfile(file):
        return NO_SUCH_IMAGE.format(filename), 404

    return send_file(file)

@app.route('/', methods=['POST', 'GET'])
@cross_origin()
def gethome():
    init_db()
    if request.method == "GET":
        return render_template("index.html")
    if request.method == "POST":
        data = request.data
        print(json.loads(data), "json baby")
        return jsonify({"sucess": True})

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
