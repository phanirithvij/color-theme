import json
import os
import uuid
from pathlib import Path

import celery as celery_lib
import werkzeug
from flask import (Flask, current_app, jsonify, redirect, render_template,
                   request, send_file, session, url_for)
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, disconnect, emit
from werkzeug.utils import secure_filename

# handling circuar imports
import server.tasks.tasks as tasks
from server.configs import JOINER as joiner
from server.configs import NO_SUCH_IMAGE
from server.configs.config import Config
from server.configs.db import (get_existing, get_existing_colors, init_db,
                               insert_file_colors, insert_pair)
from server.utils.colors import hex2rgb
from server.utils.gencss import get_colors_gen_css


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.static_folder = app.root_path + "/public"
    cors.init_app(app)
    socketio.init_app(app)
    tasks.celery.conf.update(app.config)
    return app


cors = CORS()
socketio = SocketIO()
app = create_app()
app.clients = {}


@socketio.on('status', namespace='/events')
def events_message(message):
    emit('status', {'status': message['status']})


@socketio.on('disconnect request', namespace='/events')
def disconnect_request():
    emit('status', {'status': 'Disconnected!'})
    disconnect()


@socketio.on('connect', namespace='/events')
def events_connect():
    userid = str(uuid.uuid4())
    session['userid'] = userid
    current_app.clients[userid] = request.namespace
    emit('userid', {'userid': userid})
    emit('status', {'status': 'Connected user', 'userid': userid})


@socketio.on('disconnect', namespace='/events')
def events_disconnect():
    del current_app.clients[session['userid']]
    print('Client %s disconnected' % session['userid'])


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg'}


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/upload', methods=['GET', 'POST'])
def upload_image():
    if request.method == "GET":
        return render_template('upload.html')
    elif request.method == 'POST':
        if 'file' not in request.files:
            # refresh page
            print('No file in files')
            return redirect(request.url)
        flaskfile: werkzeug.datastructures.FileStorage = request.files['file']
        print(flaskfile, type(flaskfile), dir(flaskfile))
        if flaskfile.filename == '':
            print('No selected file')
            return redirect(request.url)
        if flaskfile and allowed_file(flaskfile.filename):
            filename = secure_filename(flaskfile.filename)
            flaskfile.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            file = os.path.abspath(f"server/img/{filename}")
            jsonfile_path = f"server/tmp/{filename}.json"
            taskId: celery_lib.result.AsyncResult = tasks.process_image.delay(
                filename, file, jsonfile_path, url_for(
                    'updates', _external=True),
                # userid=request.json['userid']
            )
            # print(taskId, type(taskId), dir(taskId))
            return jsonify({
                'taskid': taskId.task_id,
                'file': flaskfile.filename
            }), 202

        return f'File not allowed {flaskfile.filename}', 403


@app.route('/colors/<filename>/data.json', methods=['GET'])
@cross_origin()
def get_colors_and_names(filename: str):
    init_db()
    # print(request.args)
    file = os.path.abspath(f"server/img/{filename}")
    if not os.path.isfile(file):
        return jsonify({
            "error": 404,
            "message": f"No such file {filename}"
        }), 404

    # get from db
    jsonfile_path = f"server/tmp/{filename}.json"
    if Path(jsonfile_path).exists():
        return send_file(Path(jsonfile_path).absolute())
    else:
        data = {'status': 'PENDING', 'error': 'The file is not ready yet'}
        return jsonify(data), 404


@app.route('/_updates', methods=['POST'])
def updates():
    # userid = request.json['userid']
    data = request.json
    print(data)
    # ns = app.clients.get(userid)
    # if ns and data:
    # socketio.emit('celerystatus', data, namespace=ns)
    return 'ok'
    # return 'error', 404


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
    img = "gin.jpg"
    if 'img' in request.args:
        img = (request.args['img'])
    if request.method == "GET":
        return render_template(
            "index.html",
            imagefile=f"/image/{img}",
            colors=[],
        )
    if request.method == "POST":
        data = request.data
        print(json.loads(data), "json baby")
        return jsonify({"sucess": True})
