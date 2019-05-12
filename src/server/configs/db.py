import sqlite3

from . import CREATE_DB

def init_db(conn: sqlite3.Connection, cur: sqlite3.Cursor):
    cur.execute(CREATE_DB)
    conn.commit()
