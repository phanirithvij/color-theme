"""
The database contains two tables
1. images
    - filename: text
    - uuid:     varchar(20)
    - time:     int
    - method:   int
2. colors
    - filename: text
    - color:    varchar(100)
    - method:   int

Methods
    1. Color theif
    2. Vibrant JS
    3. ColorCube
"""

import sqlite3
import time
import uuid

from server.configs import APP_DB
from server.configs import CREATE_TABLE_IMGS, CREATE_COLORS
from server.configs import INSERT_CSS_ENTRY, GET_CSS
from server.configs import GET_COLORS_FILE_THEIF, INSERT_COLOR_ENTRY

from server.utils.colors import rgb2hex

def init_db():
    """
    Initialize all tables in the database
    """
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    cur.execute(CREATE_TABLE_IMGS)
    cur.execute(CREATE_COLORS)
    conn.commit()

    cur.close()
    conn.close()

def insert_pair(file: str, uuid: uuid.UUID, method: int = 1):
    """
    Inserting for a css entry the uuid and filename
    including the current timestamp into images table
    """
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    timE = time.time()
    cur.execute(INSERT_CSS_ENTRY, (file, str(uuid), timE, method))
    # a learning
    conn.commit()

    cur.close()
    conn.close()

def insert_file_colors(file: str, colors: list, method: int = 1):
    """
    Insert the given list of colors and the filename to colors table
    """
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    print("INSERT")
    for i, color in enumerate(colors):
        hexc = rgb2hex(color)
        try:
            cur.execute(INSERT_COLOR_ENTRY, (file, hexc, i, method))
        except sqlite3.IntegrityError as e:
            print("No duplicates for you", file)
            print(e)
    conn.commit()

    cur.close()
    conn.close()

def get_existing(file: str) -> list:
    """
    Get existing css entry by filename
    """
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    cur.execute(GET_CSS, (file,))
    data = cur.fetchall()

    cur.close()
    conn.close()

    return data

def get_existing_colors(file: str) -> list:
    """
    Get the list of colors from the db for a given filename
    """
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    cur.execute(GET_COLORS_FILE_THEIF, (file,))
    data = cur.fetchall()

    cur.close()
    conn.close()

    return data
