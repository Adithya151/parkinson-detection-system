import os
import cv2
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.preprocessing import LabelEncoder

# -------------------------------
# SETTINGS
# -------------------------------
IMG_SIZE = 224
BATCH_SIZE = 16
EPOCHS = 5

BASE_DIR = r"C:\Users\Admin\parkinson-detection-system\data\parkinson.v1i.multiclass"

TRAIN_DIR = os.path.join(BASE_DIR, "train")
VAL_DIR = os.path.join(BASE_DIR, "valid")
TEST_DIR = os.path.join(BASE_DIR, "test")

MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "handwriting_model.h5")


# -------------------------------
# LOAD CSV + IMAGES
# -------------------------------
def load_data(folder):
    csv_files = [f for f in os.listdir(folder) if f.endswith(".csv")]
    if not csv_files:
        raise FileNotFoundError(f"No CSV found in {folder}")

    csv_path = os.path.join(folder, csv_files[0])
    df = pd.read_csv(csv_path)

    print(f"\nLoaded CSV: {csv_path}")
    print("Columns:", df.columns.tolist())

    # 🔥 CHANGE THESE IF NEEDED
    IMAGE_COL = df.columns[0]   # auto pick first column
    LABEL_COL = df.columns[-1]  # auto pick last column

    images = []
    labels = []
    skipped = 0

    for _, row in df.iterrows():
        img_name = str(row[IMAGE_COL]).strip()
        label = row[LABEL_COL]

        img_path = os.path.join(folder, img_name)

        img = cv2.imread(img_path)
        if img is None:
            skipped += 1
            continue

        img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
        img = img.astype("float32") / 255.0

        images.append(img)
        labels.append(label)

    print(f"Loaded: {len(images)} images | Skipped: {skipped}")

    return np.array(images, dtype=np.float32), np.array(labels)


# -------------------------------
# LOAD DATA
# -------------------------------
print("Loading TRAIN...")
X_train, y_train = load_data(TRAIN_DIR)

print("\nLoading VAL...")
X_val, y_val = load_data(VAL_DIR)

print("\nLoading TEST...")
X_test, y_test = load_data(TEST_DIR)

print("\nShapes:")
print("Train:", X_train.shape, y_train.shape)
print("Val  :", X_val.shape, y_val.shape)
print("Test :", X_test.shape, y_test.shape)


# -------------------------------
# LABEL ENCODING
# -------------------------------
le = LabelEncoder()
y_train = le.fit_transform(y_train)
y_val = le.transform(y_val)
y_test = le.transform(y_test)

print("\nClasses:", le.classes_)
num_classes = len(le.classes_)


# -------------------------------
# MODEL
# -------------------------------
base_model = tf.keras.applications.MobileNetV2(   # 🔥 Faster than ResNet
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)

base_model.trainable = False

if num_classes == 2:
    # Binary
    output_layer = layers.Dense(1, activation='sigmoid')
    loss_fn = 'binary_crossentropy'
else:
    # Multiclass
    output_layer = layers.Dense(num_classes, activation='softmax')
    loss_fn = 'sparse_categorical_crossentropy'

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.3),
    output_layer
])

model.compile(
    optimizer='adam',
    loss=loss_fn,
    metrics=['accuracy']
)

model.summary()


# -------------------------------
# CREATE MODEL FOLDER
# -------------------------------
os.makedirs(MODEL_DIR, exist_ok=True)


# -------------------------------
# CALLBACKS (AUTO SAVE BEST MODEL)
# -------------------------------
checkpoint = tf.keras.callbacks.ModelCheckpoint(
    filepath=MODEL_PATH,
    monitor='val_accuracy',
    save_best_only=True,
    verbose=1
)

early_stop = tf.keras.callbacks.EarlyStopping(
    monitor='val_accuracy',
    patience=3,
    restore_best_weights=True
)


# -------------------------------
# TRAIN
# -------------------------------
print("\nTraining started...\n")

history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=[checkpoint, early_stop]
)


# -------------------------------
# TEST
# -------------------------------
print("\nEvaluating...\n")

loss, acc = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {acc:.4f}")


# -------------------------------
# FINAL SAVE
# -------------------------------
FINAL_MODEL_PATH = os.path.join(MODEL_DIR, "handwriting_model_final.h5")
model.save(FINAL_MODEL_PATH)

print("\n✅ Best model saved at:", MODEL_PATH)
print("✅ Final model saved at:", FINAL_MODEL_PATH)