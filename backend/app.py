from fastapi import FastAPI, UploadFile, File
from fastapi.responses import HTMLResponse
import shutil
import os
import tensorflow as tf
import pickle
import numpy as np

from utils.preprocess import preprocess_image
from utils.fusion import final_prediction
from utils.voice_features import extract_features

app = FastAPI()

# Load models
hand_model = tf.keras.models.load_model("models/handwriting_model_final.h5")
voice_model = pickle.load(open("models/voice_model.pkl", "rb"))
voice_scaler = pickle.load(open("models/voice_scaler.pkl", "rb"))

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -------------------------------
# FRONTEND PAGE
# -------------------------------
@app.get("/", response_class=HTMLResponse)
def home():
    with open("frontend/index.html", "r") as f:
        return f.read()


# -------------------------------
# PREDICT API
# -------------------------------
@app.post("/predict")
async def predict(image: UploadFile = File(...), audio: UploadFile = File(...)):

    # Save files
    image_path = os.path.join(UPLOAD_DIR, image.filename)
    audio_path = os.path.join(UPLOAD_DIR, audio.filename)

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    # -------------------
    # HANDWRITING
    # -------------------
    img = preprocess_image(image_path)
    hand_prob = hand_model.predict(img)[0][0]
    hand_prob = float(np.clip(hand_prob, 0.01, 0.99))

    # -------------------
    # VOICE
    # -------------------
    voice_features = extract_features(audio_path)
    voice_features = np.array(voice_features).reshape(1, -1)
    voice_features = voice_scaler.transform(voice_features)

    voice_prob = voice_model.predict_proba(voice_features)[0][1]
    voice_prob = float(np.clip(voice_prob, 0.01, 0.99))

    # -------------------
    # FUSION
    # -------------------
    final_score = (0.4 * voice_prob) + (0.6 * hand_prob)
    result = final_prediction(final_score)

    confidence = final_score if result == "Parkinson" else (1 - final_score)

    return {
        "result": result,
        "confidence": round(confidence, 2),
        "handwriting_score": round(hand_prob, 2),
        "voice_score": round(voice_prob, 2)
    }