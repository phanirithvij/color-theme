import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or '@^&F!(*(bwibixb*W&bxbshj&&&'
    UPLOAD_FOLDER = "server/img/"
    THUMB_FOLDER = "server/img/thumbs/"
    EXECUTOR_PROPAGATE_EXCEPTIONS = True 
