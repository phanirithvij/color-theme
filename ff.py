"""
Gets 100 keyframes out of a video
"""

import datetime
import sys
from shutil import copyfile

import ffmpeg
from PIL import Image
from tqdm import tqdm

in_filename = sys.argv[1]
time = 3
des_width = 160
N = 130
filedest = "tmp/sonic{}.jpg"

probe = ffmpeg.probe(in_filename)

video_stream = next(
    (stream for stream in probe["streams"]
     if stream["codec_type"] == "video"), None
)

duration = float(video_stream["duration"])
width = int(video_stream["width"])
height = int(video_stream["height"])


# TODO need to generate at least 100 frames for any video even < 1s
# TODO check if we can generate 100 frames by one per each sec

minframes = 100
oneper10 = False
if duration / minframes >= 9:
    oneper10 = True

# https://superuser.com/a/821680/1049709
# ffmpeg -ss <T> -i <movie>
#   -vf select="eq(pict_type\,I)" -vframes 1 image<X>.jpg

# https://github.com/kkroening/ffmpeg-python/issues/30#issuecomment-443752220
# for global_args

# Notes: yt thumbnails

# 243 secs has 25 (5x5) thumbails
# 1193 secs has 5 5x5 thumbnails

# 420 secs has 3 (5x5), 1 (2x5) or one lower quality 9x10 single image
# which I think is used initially before loading the higher quality thumbnails

# 8hr vid has 28827 secs
# 114 (5x5), 1 (2x5)
# avg 10 secs one image

# And the grid image width is 800 if landscape video
# 250 if portrait video
# Height depends on video aspect ratio and grid (i.e. 5x5 2x5 10x10) etc.

# Selector for the thumbnail div on yt
# #movie_player > div.ytp-tooltip.ytp-bottom.ytp-preview > div.ytp-tooltip-bg
#

# 25 multiple >= N

if oneper10:
    N = int(duration / 9)

t = 10
for x in tqdm(range(N)):
    if oneper10:
        if t + 9 <= duration:
            t += 9
        else:
            t = duration - 0.1
    else:
        t = (x + 0.5) * duration / N
    # print(T, duration, video_stream['duration_ts'])
    # pad 3 zeros
    x = f"{x}".zfill(5)
    # print(T)
    # https://stackoverflow.com/a/775095/8608146
    T = datetime.timedelta(seconds=t)
    inp = (
        ffmpeg.input(in_filename, ss=T)
        # for small videos this should be removed
        .filter("select", "eq(pict_type,I)")
        .filter("scale", des_width, -2)
        .output(filedest.format(x), vframes=1)
        .global_args("-loglevel", "quiet")
        .overwrite_output()
        # .view()
    )
    # print(" ".join(inp.compile()))
    out, err = inp.run(capture_stdout=True)
    if err is not None:
        print(err)
    # print(out)

# ffmpeg -ss 3 -i {filename}
# -vsync vfr -vf "scale=160:-2,fps=fps=1/10" tmp/out%005d.jpg

# also look at montage.py

print("duration", datetime.timedelta(seconds=duration))

# fill the last image with blank images
# to make it same dimensions as all the grid images
# This will save complex logic in the client side
transp_img = Image.new("RGB", (des_width, int(des_width * height / width)))
transp_img.save("tmp/transp_img.jpg")
N25 = (N // 25 + 1) * 25
for x in tqdm(range(N, N25)):
    x = f"{x}".zfill(5)
    # just copy the generated blank file
    copyfile("tmp/transp_img.jpg", filedest.format(x))
