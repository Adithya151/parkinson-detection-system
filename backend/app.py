import os
from dotenv import load_dotenv
load_dotenv()
import shutil
from datetime import datetime
import tensorflow as tf
import pickle
import numpy as np
import re

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from passlib.context import CryptContext
from pydantic import BaseModel, Field

from utils.preprocess import preprocess_image
from utils.fusion import final_prediction
from utils.voice_features import extract_features

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PatientRegistration(BaseModel):
    name: str = Field(..., min_length=2)
    email: str
    age: int = Field(..., gt=0)
    gender: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def validate_password(password: str):
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[\W_]", password): # Special character
        return False
    return True

# MongoDB Setup
try:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    client = MongoClient(MONGO_URI)
    db = client["parkinson_db"]
    patients_col = db["patients"]
    tests_col = db["tests"]
    doctors_col = db["doctors"]
except Exception as e:
    print(f"MongoDB connection failed: {e}")


# Load models
hand_model = tf.keras.models.load_model("models/handwriting_model_final.h5")
voice_model = pickle.load(open("models/voice_model.pkl", "rb"))
voice_scaler = pickle.load(open("models/voice_scaler.pkl", "rb"))

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -------------------------------
# API ROUTES
# -------------------------------
@app.post("/api/register")
async def register_patient(data: PatientRegistration):
    if patients_col.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if not validate_password(data.password):
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long, contain one uppercase letter and one special character")
    
    hashed_pass = get_password_hash(data.password)
    
    patient_data = {
        "id": str(data.email), # Use email as ID or generate one
        "name": data.name,
        "email": data.email,
        "age": data.age,
        "gender": data.gender,
        "password": hashed_pass,
        "role": "patient",
        "created_at": datetime.utcnow()
    }
    
    patients_col.insert_one(patient_data)
    return {"status": "success", "message": "Patient registered successfully", "patient_id": patient_data["id"]}

@app.post("/api/login")
async def login(data: LoginRequest):
    if data.role == "patient":
        user = patients_col.find_one({"email": data.email})
        if not user or not verify_password(data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {"status": "success", "id": user["id"], "name": user["name"], "role": "patient"}
    
    elif data.role == "doctor":
        user = doctors_col.find_one({"email": data.email})
        # Doctors are added manually, so we just check if they exist and password matches
        # If storing plaintext password for doctors (not recommended but for demo), or bcrypt
        if not user:
            raise HTTPException(status_code=401, detail="Invalid doctor email")
        
        # We assume doctor's password might be hashed. If it's plain text, we could handle it,
        # but the standard should be hashed. For this example we use verify_password.
        # If verify_password fails, we double check if it matches plain text exactly (for manually added seeded data).
        if not verify_password(data.password, user["password"]):
             if data.password != user["password"]: # fallback for plaintext seeded doctors
                  raise HTTPException(status_code=401, detail="Invalid email or password")
             
        return {"status": "success", "id": user.get("id", data.email), "name": user.get("name", "Doctor"), "role": "doctor"}
    
    raise HTTPException(status_code=400, detail="Invalid role")

@app.post("/api/patients")
async def create_patient(data: dict):
    if "id" not in data: return {"error": "Missing patient id"}
    patients_col.insert_one(data)
    return {"status": "success", "patient_id": data["id"]}

@app.get("/api/patients")
async def get_patients():
    return list(patients_col.find({}, {"_id": 0, "password": 0}))

@app.get("/api/patient/{patient_id}")
async def get_patient(patient_id: str):
    return patients_col.find_one({"id": patient_id}, {"_id": 0, "password": 0})

@app.get("/api/tests/{patient_id}")
async def get_patient_tests(patient_id: str):
    return list(tests_col.find({"patient_id": patient_id}, {"_id": 0}).sort("date", 1))


# -------------------------------
# PREDICT API
# -------------------------------
@app.post("/predict")
async def predict(image: UploadFile = File(...), audio: UploadFile = File(...), patient_id: str = Form(None)):

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

    result_doc = {
        "result": result,
        "confidence": round(confidence, 2),
        "handwriting_score": round(hand_prob, 2),
        "voice_score": round(voice_prob, 2),
        "patient_id": patient_id,
        "date": datetime.utcnow().strftime("%Y-%m-%d")
    }

    if patient_id:
        try:
            tests_col.insert_one(result_doc)
            del result_doc["_id"] # Don't return ObjectId
        except Exception:
            pass

    return result_doc