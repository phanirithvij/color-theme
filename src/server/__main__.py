from server import socketio, app, init_db
import os

def initial_setup():
    try:
        print("[INFO] initial setup")
        os.makedirs("server/img")
        # TODO make dirs based on the dbpath from config
        os.makedirs("server/tmp")
    except Exception as e:
        print(e)
    init_db()


if __name__ == "__main__":
    initial_setup()
    socketio.run(app, debug=True, port=5000)
