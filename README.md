# 🧠 Multimodal Parkinson’s Disease Detection System

## 📌 Project Overview

This project aims to develop an AI-based system for **early detection of Parkinson’s Disease** using a **multimodal approach** combining:

* 🎤 Voice Analysis
* ✍️ Handwriting Analysis

Traditional diagnosis methods often detect Parkinson’s at later stages. This system leverages **Machine Learning and Deep Learning** to improve early detection accuracy.

---

## 🚀 Features

* Multimodal detection (Voice + Handwriting)
* Machine Learning model for voice data (Random Forest / SVM)
* Deep Learning CNN model for handwriting images
* Fusion of predictions using confidence scores
* REST API using FastAPI
* Evaluation metrics (Accuracy, Precision, Recall, F1-score)

---

## 🏗️ Project Structure

```
parkinson_project/
│
├── data/
│   ├── voice/
│   ├── handwriting/
│
├── models/
│   ├── voice_model.pkl
│   ├── handwriting_model.h5
│
├── backend/
│   ├── app.py
│
├── notebooks/
│   ├── voice_training.ipynb
│   ├── handwriting_training.ipynb
│
├── utils/
│   ├── preprocess.py
│   ├── fusion.py
│   ├── evaluate.py
│
├── requirements.txt
└── README.md
```

---

## 📊 Datasets

### 🎤 Voice Dataset

* UCI Parkinson’s Dataset
* Contains biomedical voice measurements

### ✍️ Handwriting Dataset

* HandPD Dataset
* Spiral and wave drawing images

---

## ⚙️ Installation

```bash
git clone <your-repo-link>
cd parkinson_project
pip install -r requirements.txt
```

---

## 🧪 Model Training

### Voice Model

* Open `notebooks/voice_training.ipynb`
* Train Random Forest / SVM model
* Model will be saved in `models/voice_model.pkl`

### Handwriting Model

* Open `notebooks/handwriting_training.ipynb`
* Train CNN model
* Model will be saved in `models/handwriting_model.h5`

---

## ▶️ Run Backend API

```bash
uvicorn backend.app:app --reload
```

Open:

```
http://127.0.0.1:8000/docs
```

---

## 🔗 API Endpoint

### POST `/predict/`

Upload a handwriting image to get prediction:

Response:

```json
{
  "voice_score": 0.85,
  "handwriting_score": 0.78,
  "final_score": 0.81,
  "result": "Parkinson"
}
```

---

## 🧠 Methodology

1. Data Collection
2. Data Preprocessing
3. Feature Extraction
4. Model Training
5. Multimodal Fusion
6. Evaluation

---

## 📈 Evaluation Metrics

* Accuracy
* Precision
* Recall
* F1-score

---

## 👥 Team Responsibilities

### 🔹 Member 1 (Voice Module)

* Dataset preprocessing
* Feature handling
* Model training

### 🔹 Member 2 (Handwriting Module)

* Image preprocessing
* CNN model building

### 🔹 Member 3 (Backend)

* API development
* Model integration

### 🔹 Member 4 (Fusion & Testing)

* Fusion logic
* Evaluation metrics
* Testing

---

## 📌 Current Status

* ✅ Project structure created
* ✅ Models implemented (basic version)
* ✅ Backend API working
* 🔄 Dataset integration in progress
* 🔄 Real-time input processing (Upcoming)
* ⏳ Frontend development pending

---

## 🔮 Future Work

* Real-time voice input processing (MFCC extraction)
* Improved fusion techniques (weighted fusion)
* Web-based UI for user interaction
* Model optimization and tuning
* Deployment on cloud platform

---

## 🎯 Expected Outcome

* Early detection system for Parkinson’s Disease
* Improved accuracy using multimodal data
* Non-invasive and accessible screening tool

---
