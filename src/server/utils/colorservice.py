
# import os
import sys
from collections import Counter

import numpy as np
import requests
from PIL import Image
from sklearn.cluster import KMeans

from server.utils import serviceconfig
from server.utils.names import get_names_knn

# copied from
# https://github.com/rmotr/color-extractor-service/


def rgb2hex(rgb):
    hexx = "#{:02x}{:02x}{:02x}".format(int(rgb[0]), int(rgb[1]), int(rgb[2]))
    return hexx


def get_color_service_pallete(filename: str, **kwargs) -> list:
    """
    A method which uses Kmeans
    kwarg clusters=10 default
    look in serviceconfig.py
    """
    data = []
    with open(filename, 'rb') as fp:
        data = extract_colors_from_file(fp, **kwargs)
    hexs = [x["hex"] for x in data]
    temps = get_names_knn(hexs)
    for temp, x in zip(temps, data):
        temp['count'] = x["count"]
    return temps


def calculate_new_size(image, max_width=None, max_height=None):
    WIDTH = max_width or serviceconfig.WIDTH
    HEIGHT = max_height or serviceconfig.HEIGHT

    if image.width >= image.height:
        wpercent = (WIDTH / float(image.width))
        hsize = int((float(image.height) * float(wpercent)))
        new_width, new_height = WIDTH, hsize
    else:
        hpercent = (HEIGHT / float(image.height))
        wsize = int((float(image.width) * float(hpercent)))
        new_width, new_height = wsize, HEIGHT
    return new_width, new_height


def extract_colors_from_file(file, clusters=None):
    clusters = clusters or serviceconfig.CLUSTERS

    image = Image.open(file)

    # Resize
    new_width, new_height = calculate_new_size(image)
    image = image.resize((new_width, new_height), Image.ANTIALIAS)

    img_array = np.array(image)
    if img_array.shape[2] > 3:
        img_array = img_array[:, :, :3]
    img_vector = img_array.reshape(
        (img_array.shape[0] * img_array.shape[1], 3))

    # Create model
    model = KMeans(n_clusters=clusters)
    labels = model.fit_predict(img_vector)
    label_counts = Counter(labels)

    # total_count = sum(label_counts.values())
    hex_colors = [
        rgb2hex(center) for center in model.cluster_centers_
    ]

    # print(label_counts)
    # print(hex_colors)
    data = []
    for col, count in zip(hex_colors, label_counts.values()):
        data.append({'hex': col, 'count': count})
    return data


def extract_colors_from_url(url, clusters=None):
    with requests.get(url, stream=True) as resp:
        if not resp.ok:
            raise serviceconfig.FetchImageUrlException(
                "Fetch URL failed with status: %s", resp.status_code)
        file = resp.raw
        return extract_colors_from_file(file, clusters)


if __name__ == '__main__':
    url = "".join(
        "https://images.unsplash.com/photo-1535039200576-80dc22bceb59",
        "?fit=crop&w=668&q=80"
    )
    print(get_color_service_pallete(sys.argv[1], clusters=10))
    print(extract_colors_from_url(url))
