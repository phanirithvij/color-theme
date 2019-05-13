import os

JOINER = "!#@#!"

NO_SUCH_IMAGE = """
<h1>It's a 404</h1>
No such image {} exists here please check again.
"""

APP_DB = os.path.abspath("src/server/tmp/database.db")

CREATE_DB = """\
CREATE TABLE IF NOT EXISTS images (
    filename    TEXT,
    uuid        VARCHAR (100),
    time        INT,
    PRIMARY KEY (uuid)
)
"""

CREATE_COLORS = """\
CREATE TABLE IF NOT EXISTS colors (
    filename    TEXT,
    color       VARCHAR (7),
    PRIMARY KEY (filename)
)
"""

GET_COLORS_FILE = """\
SELECT * FROM colors WHERE filename = ?;
"""

INSERT_CSS_ENTRY = """\
INSERT INTO images VALUES (
    ?, ?, ?
);
"""

GET_CSS = """\
SELECT * FROM images WHERE filename = ?;
"""

CLEAN_UP_SQL = """\
DELETE FROM images WHERE filename = ?;
"""
