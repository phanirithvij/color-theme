JOINER = "!#@#!"

CREATE_DB = """\
CREATE TABLE IF NOT EXISTS images (
    filename    TEXT,
    uuid        VARCHAR (100),
    time        INT,
    PRIMARY KEY (uuid)
)
"""

INSERT_CSS_ENTRY = """\
INSERT INTO images VALUES(
    {}, {}, {}
);
"""

GET_CSS = """\
SELECT * FROM images WHERE filename = {};
"""

CLEAN_UP_SQL = """\
DELETE FROM images WHERE filename = {};
"""
