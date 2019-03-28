from utils import get_colors
import os

from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_url_path='')

@app.route('/<filename>/')
def getcolors(filename:str):
    print(request.args)
    file = os.path.abspath(f"src/server/{filename}")
    colors = (get_colors(file))
    return jsonify(colors)

@app.route('/js/<path:path>')
def getJs(path):
    print("fuk me", path)
    return app.send_static_file("src/server/public/js/", path)

@app.route('/')
def gethome():
    return app.send_static_file("src/server/public/index.html")


@app.route('/css/<path:path>')
def getCss(path):
    return send_from_directory("src\\server\\public\\css\\", path)

if __name__ == "__main__":
    app.run(debug=True, port=5000)

