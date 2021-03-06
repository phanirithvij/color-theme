import os
import sys

from server.utils.colors import rgb2hex

# sys.path.insert(1, os.path.join(sys.path[0], '..'))
print('__file__={0:<35} | __name__={1:<20} | __package__={2:<20}'.format(
    __file__, __name__, str(__package__)))


"""
Usage from src directory

py -m server.scripts.resne server/data/resenecolours.txt server/data/resene.csv
"""

with open(os.path.abspath(sys.argv[1]), 'r') as txt:
    with open(os.path.join(sys.argv[2]), 'w+') as out:
        out.write("\"name\",\"hex\",\"red\",\"green\",\"blue\"\n")
        for line in txt.readlines():
            col, r, g, b = (line.strip().split('\t'))
            col = col.replace('Resene', '')
            col = col.replace('"', '')
            col = col.strip()
            hexv = rgb2hex((int(r), int(g), int(b)))
            out.write(f"{col},{hexv},{r},{g},{b}\n")
