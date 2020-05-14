import json

from celery import Celery
from celery.utils.log import get_task_logger

from server.configs import JOINER as joiner
from server.configs.config import Config
from server.configs.db import get_existing, insert_file_colors, insert_pair
from server.utils import get_colors_colortheif
from server.utils.baster import get_baster_colors
from server.utils.colors import rgb2hex
from server.utils.colorservice import get_color_service_pallete
from server.utils.cube import get_colors_cube
from server.utils.gencss import get_colors_gen_css
from server.utils.get_colors import get_colors_image_js
from server.utils.names import get_names_knn
from server.utils.vibrant import get_vibrants
import requests

logger = get_task_logger(__name__)

celery = Celery(__name__, broker=Config.CELERY_BROKER_URL,
                backend=Config.CELERY_RESULT_BACKEND)


class Task:
    """
    A simple task api.
    """

    def __init__(self, update_url: str):
        self._progress = {'status': 'PENDING'}
        self.update_url = update_url

    @property
    def progress(self):
        return self._progress
    # a setter function for progress
    # which sends updates to the initially specified update_url

    @progress.setter
    def progress(self, value):
        self._progress = value
        self.update()

    def update(self):
        r = requests.post(self.update_url, json=self._progress)
        if r.status_code != 200:
            logger.warn(msg=' '.join(
                [f"Response for {self.update_url}",
                 f"was {r.status_code} != 200"]))


@celery.task(bind=True)
def process_image(
        self,
        filename: str,
        file: str,
        jsonfile_path: str,
        progress_url: str):

    print(self.request.id)

    data = {
        "file": filename
    }

    task = Task(progress_url)

    progress = {'status': 'started', 'current': 0, 'total': 6}
    task.progress = progress

    ex_colors = get_colors_colortheif(file)
    # rgb to hex to get the names
    ex_colors_hex = [rgb2hex(x) for x in ex_colors[1]]
    ex_colors_names = get_names_knn(ex_colors_hex)
    data["palette"] = ex_colors_names
    progress['current'] += 1
    task.progress = progress
    logger.info(msg=f"colortheif done for {filename}")

    data["vibrant_palette"] = get_vibrants(file)
    progress['current'] += 1
    task.progress = progress
    logger.info(msg=f"vibrant.go done for {filename}")
    # print(vibrant_palette)

    data["rgbaster"] = get_baster_colors(file)
    data["main"] = data["rgbaster"][0]
    progress['current'] += 1
    task.progress = progress
    logger.info(msg=f"rgbaster done for {filename}")

    data["cube"] = get_colors_cube(file)
    progress['current'] += 1
    task.progress = progress
    logger.info(msg=f"colorcube done for {filename}")

    data["service"] = get_color_service_pallete(file)
    progress['current'] += 1
    task.progress = progress
    logger.info(msg=f"colors-service done for {filename}")

    data["get_colors"] = get_colors_image_js(file)
    progress['current'] += 1
    task.progress = progress
    logger.info(msg=f"get-image-colors done for {filename}")

    exist_css = get_existing(filename)
    if not exist_css:
        uid, colors, css_file = get_colors_gen_css(filename, joiner)
        # insert to css_table in db
        insert_pair(filename, uid)
    # theif => method = 1 default
    insert_file_colors(filename, ex_colors[1])

    # save generated json file to disk
    # do this with celery
    with open(jsonfile_path, 'w+') as jsonfile:
        json.dump(data, jsonfile)

    progress['current'] += 1
    progress['status'] = 'DONE'
    task.progress = progress
    logger.info(msg=f'Wrote extracted colors to {jsonfile}')
