from sklearn.neighbors import KNeighborsClassifier
from sklearn import preprocessing
import pandas as pd


class Knn:

    def __init__(self, dataset="server/data/xkcd.csv"):
        self.dataset = dataset
        self.train_model()

    def prepare_dataset(self):
        data = pd.read_csv(self.dataset)

        self.color_names = data['name'].tolist()
        self.r = data['red'].tolist()
        self.g = data['green'].tolist()
        self.b = data['blue'].tolist()

    def encode_dataset(self):
        self.prepare_dataset()

        le = preprocessing.LabelEncoder()

        r_encoded = le.fit_transform(self.r)
        g_encoded = le.fit_transform(self.g)
        b_encoded = le.fit_transform(self.b)
        self.features = list(zip(r_encoded, g_encoded, b_encoded))

        self.labels = le.fit_transform(self.color_names)

    def train_model(self):
        self.encode_dataset()
        self.target_colors = {}
        for label, name, r, g, b in \
                zip(self.labels, self.color_names, self.r, self.g, self.b):
            self.target_colors[label] = [name, r, g, b]
        self.model = KNeighborsClassifier(n_neighbors=1)
        self.model.fit(self.features, self.labels)

    def get_color_name(self, r, g, b):
        # print(self.model.predict([[r, g, b]]))

        name = self.target_colors[int(self.model.predict([[r, g, b]])[0])]
        # print(name)
        return name
