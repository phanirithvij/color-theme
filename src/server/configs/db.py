import sqlite3
import time

from . import CREATE_DB, INSERT_CSS_ENTRY, GET_CSS, APP_DB


def init_db():
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    cur.execute(CREATE_DB)
    conn.commit()

    cur.close()
    conn.close()


def insert_pair(file: str, uuid: str):
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    timE = time.time()
    cur.execute(INSERT_CSS_ENTRY, (file, uuid, timE))
    conn.commit()

    cur.close()
    conn.close()


def get_existing(file: str):
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    cur.execute(GET_CSS, (file,))
    data = cur.fetchall()

    cur.close()
    conn.close()

    return data
