import json
import os

# import jinja2
from flask import Flask, jsonify, render_template, request, send_file
from flask_cors import CORS, cross_origin

from server.configs import JOINER as joiner
from server.configs import NO_SUCH_IMAGE
from server.configs.db import (get_existing, get_existing_colors, init_db,
                               insert_file_colors, insert_pair)
# from utils.gencss import gen_css
from server.utils import get_colors_colortheif
from server.utils.baster import get_baster_colors
from server.utils.colors import hex2rgb, rgb2hex
from server.utils.colorservice import get_color_service_pallete
from server.utils.cube import get_colors_cube
from server.utils.gencss import get_colors_gen_css
from server.utils.names import get_names
from server.utils.vibrant import get_vibrants

# import uuid
# import sqlite3


app = Flask(__name__)
cors = CORS(app)

app.static_folder = app.root_path + "/public"

# https://stackoverflow.com/a/13598839/8608146
# my_loader = jinja2.ChoiceLoader([
#     app.jinja_loader,
#     jinja2.FileSystemLoader(
# [app.static_folder, app.root_path + '/templates']),
# ])
# app.jinja_loader = my_loader


@app.route('/colors/<filename>/data.json', methods=['GET'])
@cross_origin()
def get_colors_and_names(filename: str):
    init_db()
    print(request.args)
    file = os.path.abspath(f"server/img/{filename}")
    data = {}
    if not os.path.isfile(file):
        return jsonify({
            "error": 404,
            "message": f"No such file {filename}"
        }), 404

    vibrant_palette = get_vibrants(file)
    print(vibrant_palette)

    # get from db
    colors = get_existing_colors(filename)
    if colors and len(colors):
        pure_colors = [x[1] for x in colors]
        colors_names = get_names(pure_colors)
        baster_colors = get_baster_colors(file)
        data = {
            "file": filename,
            # "main": get_names([colors[0][1]])[0],
            "main": baster_colors[0],
            "palette": colors_names,
            "vibrant_palette": vibrant_palette,
            "cube": get_colors_cube(file),
            "rgbaster": get_baster_colors(file),
            "service": get_color_service_pallete(file),
        }
    else:
        ex_colors = get_colors_colortheif(file)
        # rgb to hex to get the names
        ex_colors_hex = [rgb2hex(x) for x in ex_colors[1]]
        ex_colors_names = get_names(ex_colors_hex)
        baster_colors = get_baster_colors(file)
        data = {
            "file": filename,
            # "main": get_names([rgb2hex(ex_colors[0])]),
            "main": baster_colors[0],
            "palette": ex_colors_names,
            "vibrant_palette": vibrant_palette,
            "cube": get_colors_cube(file),
            "rgbaster": baster_colors,
            "service": get_color_service_pallete(file),
        }
        exist_css = get_existing(filename)
        if not exist_css:
            uid, colors, css_file = get_colors_gen_css(filename, joiner)
            # insert to css_table in db
            insert_pair(filename, uid)
        # theif => method = 1 default
        insert_file_colors(filename, ex_colors[1])
    return jsonify(data)


@app.route('/colorcss/<filename>/style.css', methods=['GET'])
@cross_origin()
def getcolorCss(filename: str):
    init_db()
    print(request.args)
    css_file_exists = False
    css_file = None
    temp_dir = os.path.abspath('server/tmp/')
    image_dir = os.path.abspath("server/img/")

    file_act_path = os.path.abspath(os.path.join(image_dir, filename))

    if not os.path.isfile(file_act_path):
        print(f"[server.py:getcolorCss] > {filename} is inexistent")
        return send_file(os.path.abspath("server/public/css/404.css"))

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
        # theif => method = 1 default
        insert_file_colors(filename, colors[1])

    return send_file(css_file)  # send a freshly created css file


@app.route('/image/<filename>', methods=['GET'])
@cross_origin()
def getimage(filename: str):
    init_db()
    print(request.args)
    file = os.path.abspath(f"server/img/{filename}")

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
