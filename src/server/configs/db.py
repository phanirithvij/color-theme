"""
The database contains two tables
1. images
    - filename: text
    - uuid:     varchar(20)
    - time:     int
2. colors
    - filename: text
    - color:    varchar(100)
"""

import sqlite3
import time
import uuid

from . import APP_DB
from . import CREATE_TABLE_IMGS, CREATE_COLORS
from . import INSERT_CSS_ENTRY, GET_CSS
from . import GET_COLORS_FILE, INSERT_COLOR_ENTRY

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

def insert_pair(file: str, uuid: uuid.UUID):
    """
    Inserting for a css entry the uuid and filename
    including the current timestamp into images table
    """
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    timE = time.time()
    print("CSS INSERT")
    print(file, uuid, timE)
    print(type(file), type(uuid), type(timE))
    cur.execute(INSERT_CSS_ENTRY, (file, str(uuid), timE))
    conn.commit()

    cur.close()
    conn.close()

def insert_file_colors(file: str, colors: list):
    """
    Insert the given list of colors and the filename to colors table
    """
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    print("INSERT")
    for color in colors:
        hexc = '#%02X%02X%02X' % color
        cur.execute(INSERT_COLOR_ENTRY, (file, hexc))
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

    cur.execute(GET_COLORS_FILE, (file,))
    data = cur.fetchall()

    cur.close()
    conn.close()

    return data
