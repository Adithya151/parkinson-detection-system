import cv2
import numpy as np

IMG_SIZE = 224

def preprocess_image(img_path):
    img = cv2.imread(img_path)

    if img is None:
        raise ValueError("Image not found!")

    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    img = img / 255.0
    img = np.expand_dims(img, axis=0)

    return img