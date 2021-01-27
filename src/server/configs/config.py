import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard to guess string'
    UPLOAD_FOLDER = "server/img/"

    # session
    # SESSION_TYPE = "redis"

    @staticmethod
    def init_app(app):
        pass
