import subprocess
from PIL import Image
from tqdm import tqdm
from shutil import copyfile
import glob

filepattern = "tmp/sonic{}.jpg"
files = glob.glob(filepattern.format('*'))
filecount = len(files)
# print(filecount)

des_width, des_height = Image.open(filepattern.format("001")).size
print(des_width, des_height)

transp_img = Image.new('RGB', (des_width, des_height))
transp_img.save('tmp/transp_img.jpg')
N25 = (filecount // 25 + 1) * 25
for x in tqdm(range(filecount, N25)):
    x = f"{x}".zfill(3)
    # just copy the generated blank file
    copyfile('tmp/transp_img.jpg', filepattern.format(x))

files = glob.glob(filepattern.format('*'))
filecount = len(files)

out = subprocess.check_output(
    [
        'montage',
        *files,
        '-tile', '5x5', '-geometry', '+0+0', 'tmp/montage.jpg'
    ])

# for n in range(0, filecount, 25):
# print(files[n: n+25])
# out = subprocess.check_output(['montage', *files[n: n+25], '-tile', '5x5',
# '-geometry', '+0+0', 'montage-{}.jpg'.format(n//25)])
# print(out)
