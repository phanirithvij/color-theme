import os
import sys


"""
Usage
py D:\\Images\\pallete\\pallete-theme\\src\\server\\scripts\\resne.py \
    D:\\Images\\pallete\\pallete-theme\\resenecolours.txt \
    D:\\Images\\pallete\\pallete-theme\\resene.csv
"""

with open(os.path.abspath(sys.argv[1]), 'r') as txt:
    with open(os.path.join(sys.argv[2]), 'w+') as out:
        for line in txt.readlines():
            col, r, g, b = (line.strip().split('\t'))
            col = col.replace('Resene', '')
            col = col.replace('"', '')
            col = col.strip()
            out.write(f"{col},{r},{g},{b}\n")
