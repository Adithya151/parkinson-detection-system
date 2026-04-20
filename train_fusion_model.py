import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
import os

# -------------------------------
# CREATE DUMMY TRAINING DATA
# -------------------------------
X = []
y = []

for _ in range(1000):
    voice = np.random.rand()
    hand = np.random.rand()

    label = 1 if (0.6 * hand + 0.4 * voice) > 0.5 else 0

    X.append([voice, hand])
    y.append(label)

X = np.array(X)
y = np.array(y)

# -------------------------------
# MODEL
# -------------------------------
model = models.Sequential([
    layers.Dense(8, activation='relu', input_shape=(2,)),
    layers.Dense(4, activation='relu'),
    layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

print("Training fusion model...")
model.fit(X, y, epochs=20)

# -------------------------------
# SAVE MODEL
# -------------------------------
os.makedirs("models", exist_ok=True)

model.save("models/fusion_model.h5")

print("✅ fusion_model.h5 created!")