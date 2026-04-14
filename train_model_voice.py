import pandas as pd
import numpy as np
import os
import pickle

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


# -------------------------------
# PATH (FIXED)
# -------------------------------
DATA_PATH = r"C:\Users\Admin\parkinson-detection-system\data\parkison_voice\parkinsons.data"


# -------------------------------
# CHECK FILE EXISTS
# -------------------------------
print("Checking file path...")
print("Path:", DATA_PATH)
print("Exists:", os.path.exists(DATA_PATH))

if not os.path.exists(DATA_PATH):
    raise FileNotFoundError("❌ Dataset file not found. Check your path!")


# -------------------------------
# LOAD DATA
# -------------------------------
df = pd.read_csv(DATA_PATH)

print("\n✅ Dataset Loaded!")
print("Shape:", df.shape)
print("Columns:", df.columns.tolist())


# -------------------------------
# PREPROCESS
# -------------------------------
# Remove 'name' column
if 'name' in df.columns:
    df = df.drop(['name'], axis=1)

# Features and target
X = df.drop('status', axis=1)
y = df['status']

print("\nFeature shape:", X.shape)
print("Target shape:", y.shape)


# -------------------------------
# TRAIN TEST SPLIT
# -------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# -------------------------------
# FEATURE SCALING
# -------------------------------
scaler = StandardScaler()

X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)


# -------------------------------
# MODEL
# -------------------------------
model = RandomForestClassifier(
    n_estimators=150,
    random_state=42
)

print("\n🚀 Training model...")
model.fit(X_train, y_train)


# -------------------------------
# EVALUATION
# -------------------------------
y_pred = model.predict(X_test)

print("\n🎯 Accuracy:", accuracy_score(y_test, y_pred))

print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred))

print("\n📉 Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))


# -------------------------------
# SAVE MODEL + SCALER
# -------------------------------
os.makedirs("models", exist_ok=True)

MODEL_PATH = os.path.join("models", "voice_model.pkl")
SCALER_PATH = os.path.join("models", "voice_scaler.pkl")

with open(MODEL_PATH, "wb") as f:
    pickle.dump(model, f)

with open(SCALER_PATH, "wb") as f:
    pickle.dump(scaler, f)

print("\n✅ Model saved at:", MODEL_PATH)
print("✅ Scaler saved at:", SCALER_PATH)