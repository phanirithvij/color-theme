from celery import Celery

config = {}
config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'

celery = Celery(__name__, broker=config['CELERY_BROKER_URL'])
celery.conf.update(config)


@celery.task
def add(x, y):
    return x + y
