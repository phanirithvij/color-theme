from server import socketio, app, init_db

if __name__ == "__main__":
    init_db()
    socketio.run(app, debug=True, port=5000)
