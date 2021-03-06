import json
import os
import random
import uuid
from pathlib import Path

import sentry_sdk
import mimetypes
from flask import (Flask, current_app, jsonify, redirect, render_template,
                   request, send_file, session, url_for)
from flask.helpers import send_from_directory
from flask_cors import CORS, cross_origin
from flask_executor import Executor
from flask_session import Session
from flask_socketio import SocketIO, disconnect, emit, join_room, leave_room
from sentry_sdk.integrations.flask import FlaskIntegration
from tusfilter import TusFilter
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

sentry_sdk.init(
    dsn='https://ee7f10c130dd4f269c6e369db226b60b@o393433.ingest.sentry.io/5242511',
    integrations=[FlaskIntegration()],
    # debug=True,
)


def initial_setup():
    os.makedirs("server/img", exist_ok=True)
    # TODO make dirs based on the dbpath from config
    os.makedirs("server/tmp", exist_ok=True)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.static_folder = app.root_path + "/public"
    cors.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    sess.init_app(app)
    executor.init_app(app)
    return app


cors = CORS()
socketio = SocketIO()
sess = Session()
executor = Executor()

app = create_app()

GB = 2**30
TUS_UPLOAD_FOLDER = os.path.abspath(app.config['UPLOAD_FOLDER'])

app.wsgi_app = TusFilter(
    app.wsgi_app,
    upload_path='/tus_upload',
    tmp_dir=TUS_UPLOAD_FOLDER,
    max_size=3*GB,
    send_file=True,
)

initial_setup()


def process_image(filename, uid, elid, ext):
    file = os.path.abspath(os.path.join(TUS_UPLOAD_FOLDER, filename))
    jsonfile_path = f"server/tmp/{filename}.json"
    clsx = tasks.CustomTask()
    taskID = f"{uid}@{elid}"
    # generate thumbnail
    thumb_path = os.path.join(app.config['THUMB_FOLDER'], f"{filename}{ext}")
    executor.submit(clsx.generate_thumbnail, file, ext, thumb_path)
    # start processing the image
    executor.submit_stored(
        taskID,
        clsx.process_image,
        filename, file, jsonfile_path,
        uid,
        elid,
        ext,
        url_for('updates', _external=True),
    )
    # get a task id and and send it to client
    return jsonify({
        'taskid': taskID,
        'file': filename
    }), 202


@app.route("/tus_upload/<tmpfile>", methods=['GET', 'PATCH'])
def tus_upload(tmpfile):
    print(tmpfile)
    # check if file exists
    info_path = os.path.join(TUS_UPLOAD_FOLDER, tmpfile + '.info')
    if os.path.exists(info_path):
        with open(info_path, 'r') as f:
            info = json.load(f)
            upload_metadata = info['upload_metadata']

        if upload_metadata:
            if request.method == "GET":
                download = False
                if 'download' in request.args or 'dl' in request.args:
                    download = True
                # NOTE we should not pass abspath for filename to send_from_dir
                # WE MUST pass abspath for dirname or it will use root_path
                # which is different from our directory
                return send_from_directory(
                    TUS_UPLOAD_FOLDER,
                    tmpfile,
                    as_attachment=download,
                    attachment_filename=upload_metadata['name'],
                    mimetype=upload_metadata['type'],
                )

            # PATCH
            return process_image(
                tmpfile,
                upload_metadata['userID'],
                upload_metadata['progressID'],
                mimetypes.guess_extension(upload_metadata['type'])
            )
    print("[WARNING] info file doesn't exist for", tmpfile)
    return send_from_directory(TUS_UPLOAD_FOLDER, tmpfile)


def see(x):
    print(x)
    print(dir(x))


executor.add_default_done_callback(see)

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
    print(request.namespace)
    userid = str(uuid.uuid4())
    session['userid'] = userid
    # https://stackoverflow.com/questions/39423646/flask-socketio-emit-to-specific-user
    current_app.clients[userid] = request.sid
    join_room(request.sid, namespace='/events')
    emit('userid', {'userid': userid})
    emit('status', {'status': 'Connected user', 'userid': userid})


@socketio.on('disconnect', namespace='/events')
def events_disconnect():
    leave_room(current_app.clients[session['userid']], namespace='/events')
    del current_app.clients[session['userid']]
    print('Client %s disconnected' % session['userid'])


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'}


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/view/random')
def random_image():
    #import random
    init_db()
    img_dir = Path(TUS_UPLOAD_FOLDER)
    # TODO better way to handle random images
    files = []
    for file in img_dir.iterdir():
        files.append(file)
    img = random.choice(files).name
    return render_template("image.html", imagefile=f"/tus_upload/{img}", colors=[])

@app.route('/view')
def red_view():
    return redirect('all')

@app.route('/')
@app.route('/all')
@app.route('/new')
def all():
    uppy = False
    if request.path == "/new":
        uppy = True
    upload_dir = Path(TUS_UPLOAD_FOLDER)
    images = []
    for x in upload_dir.iterdir():
        if x.is_file() and os.path.splitext(x)[-1] != ".info":
            images.append(os.path.basename(x))
    print(uppy)
    return render_template('list.html', images=images, uppy=uppy)


@app.route('/upload', methods=['GET'])
def upload_image():
    return render_template('upload.html')


@app.route('/colors/<filename>/data.json', methods=['GET'])
@cross_origin()
def get_colors_and_names(filename: str):
    init_db()
    # print(request.args)
    file = os.path.abspath(os.path.join(TUS_UPLOAD_FOLDER, filename))
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
    userid = request.json['userid']
    data = request.json
    # print(data)
    room = app.clients.get(userid)
    # print('room', room)
    # if ns and data:
    # must specify both namespace and room
    # room is for this single user
    socketio.emit('updatestatus', data,
                  room=room, namespace='/events')
    # socketio.emit('updatestatus', data, namespace=ns)
    return 'ok'
    # return 'error', 404


@app.route('/colorcss/<filename>/style.css', methods=['GET'])
@cross_origin()
def getcolor_css(filename: str):
    init_db()
    print(request.args)
    css_file_exists = False
    css_file = None
    temp_dir = os.path.abspath('server/tmp/')
    image_dir = os.path.abspath(TUS_UPLOAD_FOLDER)

    file_act_path = os.path.abspath(os.path.join(image_dir, filename))

    if not os.path.isfile(file_act_path):
        print(f"[server.py:getcolor_css] > {filename} is inexistent")
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

    colors = []
    if not css_file_exists:
        uid, colors, css_file = get_colors_gen_css(filename, joiner)
        # insert to css_table in db
        insert_pair(filename, uid)
    if not get_existing_colors(filename):
        # theif => method = 1 default
        if len(colors) != 0:
            insert_file_colors(filename, colors[1])
        else:
            print("[WARNING] Colors are not extracted")

    return send_file(css_file)  # send a freshly created css file


@app.route('/thumb/<filename>', methods=['GET'])
def thumbnail(filename: str):
    init_db()
    file = os.path.abspath(os.path.join(TUS_UPLOAD_FOLDER, filename))

    if not os.path.isfile(file):
        return NO_SUCH_IMAGE.format(filename), 404

    ext = None
    info_path = os.path.join(TUS_UPLOAD_FOLDER, file + '.info')
    if os.path.exists(info_path):
        with open(info_path, 'r') as f:
            info = json.load(f)
            upload_metadata = info['upload_metadata']

        ext = mimetypes.guess_extension(upload_metadata['type'])

    thumb_name = f"{filename}{ext}"
    thumb_path = os.path.join(app.config['THUMB_FOLDER'], thumb_name)
    if not os.path.exists(thumb_path):
        clsx = tasks.CustomTask()
        print("Generating thumbnail for", filename, " now")
        if ext == None:
            ext = '.png'
            print("[WARNING] file type couldn't be determined assuming png")
        clsx.generate_thumbnail(file, ext, thumb_path)

    abs_thumb_dir = os.path.abspath(app.config['THUMB_FOLDER'])

    return send_from_directory(abs_thumb_dir, thumb_name)


@app.route('/view/<img>', methods=['POST', 'GET'])
@cross_origin()
def viewimage(img):
    init_db()
    if request.method == "GET":
        return render_template(
            "image.html",
            imagefile=f"/tus_upload/{img}",
            colors=[],
        )
    if request.method == "POST":
        data = request.data
        print(json.loads(data), "json baby")
        return jsonify({"sucess": True})
