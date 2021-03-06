import json
import os
import shutil
import sys
from logging import StreamHandler, getLogger
from typing import Any, Dict

import requests
from PIL import Image
from server.configs import JOINER as joiner
from server.configs.db import get_existing, insert_file_colors, insert_pair
from server.utils import get_colors_colortheif
from server.utils.baster import get_baster_colors
from server.utils.colors import rgb2hex
from server.utils.colorservice import get_color_service_pallete
from server.utils.cube import get_colors_cube
from server.utils.gencss import get_colors_gen_css
from server.utils.get_colors import get_colors_image_js
from server.utils.names import get_names_knn
from server.utils.vibrant import get_vibrants, get_vibrants_node

logger = getLogger(__name__)
logger.addHandler(StreamHandler(sys.stdout))
PROCESS_DIR = "server/tmp/queue"
TUS_UPLOAD_FOLDER = "server/img"

os.makedirs(PROCESS_DIR, exist_ok=True)

# TODO extend Thread?


class CustomTask():
    """
    A simple task api.
    """

    def __init__(self):
        logger.info(msg=f"New CustomTask created {id(self)}")

    @property
    def progress(self) -> Dict[str, Any]:
        return self._progress
    # a setter function for progress
    # which sends updates to the initially specified update_url

    def configure(self, update_url: str, user_id: str):
        self.update_url = update_url
        self.user_id = user_id
        self._progress = {'status': 'PENDING', 'userid': user_id}

    @progress.setter
    def progress(self, value):
        self._progress = value
        self.update()

    def update(self):
        assert self.update_url is not None
        r = requests.post(self.update_url, json=self._progress)
        if r.status_code != 200:
            logger.warn(msg=' '.join(
                [f"Response for {self.update_url}",
                 f"was {r.status_code} != 200"]))

    @classmethod
    def create_tmp_file(cls, filename, ext, file):
        tmpfile = f"{PROCESS_DIR}/{filename}{ext}"
        shutil.copy(file, tmpfile)
        return tmpfile

    @classmethod
    def remove_tmp_file(cls, tmpfile):
        os.remove(tmpfile)

    def generate_thumbnail(self, file: str, ext: str, dest: str):
        name = os.path.basename(file)
        tmpfile = CustomTask.create_tmp_file(name, ext, file)
        name = os.path.basename(tmpfile)
        orig = Image.open(tmpfile)
        orig.thumbnail((150, 150))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        orig.save(dest)

    def process_image(
            self,
            filename: str,
            file: str,
            jsonfile_path: str,
            user_id: str,
            element_id: str,
            ext: str,
            update_url: str):

        # create a file temporarily to process
        # and delete it later
        tmpfile = CustomTask.create_tmp_file(filename, ext, file)

        data = {
            "file": filename
        }

        # must be called
        self.configure(update_url, user_id)

        progress = {
            'status': 'started',
            'current': 0,
            'total': 8,
            'userid': user_id,
            'elementid': element_id,
            'filename': filename
        }
        self.progress = progress

        # TODO all the following in parallel
        # just read the image and process so no clashes

        ex_colors = get_colors_colortheif(tmpfile)
        # rgb to hex to get the names
        ex_colors_hex = [rgb2hex(x) for x in ex_colors[1]]
        ex_colors_names = get_names_knn(ex_colors_hex)
        data["palette"] = ex_colors_names
        progress['current'] += 1
        self.progress = progress
        logger.info(msg=f"colortheif done for {filename}")

        data["vibrant_palette"] = get_vibrants(tmpfile)
        progress['current'] += 1
        self.progress = progress
        logger.info(msg=f"vibrant.go done for {filename}")
        # print(vibrant_palette)

        data["node_vibrant"] = get_vibrants_node(tmpfile)
        progress['current'] += 1
        self.progress = progress
        logger.info(msg=f"node vibrant done for {filename}")

        data["rgbaster"] = get_baster_colors(tmpfile)
        data["main"] = data["rgbaster"][0]
        progress['current'] += 1
        self.progress = progress
        logger.info(msg=f"rgbaster done for {filename}")

        data["cube"] = get_colors_cube(tmpfile)
        progress['current'] += 1
        self.progress = progress
        logger.info(msg=f"colorcube done for {filename}")

        data["service"] = get_color_service_pallete(tmpfile)
        progress['current'] += 1
        self.progress = progress
        logger.info(msg=f"colors-service done for {filename}")

        data["get_colors"] = get_colors_image_js(tmpfile)
        progress['current'] += 1
        self.progress = progress
        logger.info(msg=f"get-image-colors done for {filename}")

        exist_css = get_existing(filename)
        if not exist_css:
            uid, ex_colors, css_file = get_colors_gen_css(filename, joiner)
            # insert to css_table in db
            insert_pair(filename, uid)
        # theif => method = 1 default
        insert_file_colors(filename, ex_colors[1])

        # save generated json file to disk
        # TODO do this in background
        with open(jsonfile_path, 'w+') as jsonfile:
            json.dump(data, jsonfile)

        progress['current'] += 1
        progress['status'] = 'DONE'
        self.progress = progress
        logger.info(msg=f'Wrote extracted colors to {jsonfile}')

        logger.info(msg=f"Done processing {tmpfile} removing")
        CustomTask.remove_tmp_file(tmpfile)
