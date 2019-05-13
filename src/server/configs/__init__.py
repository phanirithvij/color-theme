import os

JOINER = "!#@#!"

NO_SUCH_IMAGE = """
<h1>It's a 404</h1>
No such image {} exists here please check again.
"""

APP_DB = os.path.abspath("src/server/tmp/database.db")

CREATE_TABLE_IMGS = """\
CREATE TABLE IF NOT EXISTS images (
    filename    VARCHAR (200),
    uuid        VARCHAR (40),
    time        REAL,
    PRIMARY KEY (uuid)
);
"""

CREATE_COLORS = """\
CREATE TABLE IF NOT EXISTS colors (
    filename    TEXT,
    color       VARCHAR (7),
    number      INTEGER,
    UNIQUE(filename, color, number)
);
"""

GET_COLORS_FILE = """\
SELECT * FROM colors WHERE filename = ?;
"""

INSERT_COLOR_ENTRY = """\
INSERT INTO colors (filename, color, number) VALUES (?, ?, ?);
"""

INSERT_CSS_ENTRY = """\
INSERT INTO images (filename, uuid, time) VALUES (?, ?, ?);
"""

GET_CSS = """\
SELECT * FROM images WHERE filename = ?;
"""

CLEAN_UP_SQL = """\
DELETE FROM images WHERE filename = ?;
"""
