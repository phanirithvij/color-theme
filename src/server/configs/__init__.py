import os

JOINER = "!#@#!"

NO_SUCH_IMAGE = """
<h1>It's a 404</h1>
No such image {} exists here please check again.
"""

APP_DB = os.path.abspath("src/server/tmp/database.db")

CREATE_TABLE_IMGS = """\
CREATE TABLE IF NOT EXISTS images (
    filename    VARCHAR (200) NOT NULL,
    uuid        VARCHAR (40)  NOT NULL,
    time        REAL  NOT NULL,
    method      INTEGER NOT NULL,
    PRIMARY KEY (uuid)
);
"""

CREATE_COLORS = """\
CREATE TABLE IF NOT EXISTS colors (
    filename    VARCHAR (200) NOT NULL,
    color       VARCHAR (7) NOT NULL,
    number      INTEGER  NOT NULL,
    method      INTEGER  NOT NULL,
    UNIQUE(filename, color, number, method)
);
"""

GET_COLORS_FILE_THEIF = """\
SELECT * FROM colors WHERE filename = ? AND method = 1;
"""

GET_COLORS_FILE_VIBRANT = """\
SELECT * FROM colors WHERE filename = ? AND method = 2;
"""

GET_COLORS_FILE_CUBE = """\
SELECT * FROM colors WHERE filename = ? AND method = 3;
"""

INSERT_COLOR_ENTRY = """\
INSERT INTO colors (filename, color, number, method) VALUES (?, ?, ?, ?);
"""

INSERT_CSS_ENTRY = """\
INSERT INTO images (filename, uuid, time, method) VALUES (?, ?, ?, ?);
"""

GET_CSS = """\
SELECT * FROM images WHERE filename = ?;
"""

CLEAN_UP_SQL = """\
DELETE FROM images WHERE filename = ?;
"""
