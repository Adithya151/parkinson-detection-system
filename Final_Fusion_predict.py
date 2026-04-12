import tensorflow as tf
import pickle
import numpy as np
import pandas as pd

from utils.preprocess import preprocess_image
from utils.fusion import fusion_score, final_prediction

# -------------------------------
# LOAD MODELS
# -------------------------------
hand_model = tf.keras.models.load_model("models/handwriting_model_final.h5")

voice_model = pickle.load(open("models/voice_model.pkl", "rb"))
voice_scaler = pickle.load(open("models/voice_scaler.pkl", "rb"))

print("✅ Models Loaded")


# -------------------------------
# HANDWRITING PREDICTION
# -------------------------------
def predict_handwriting(image_path):
    img = preprocess_image(image_path)
    pred = hand_model.predict(img, verbose=0)[0][0]

    # Clip extreme values (stability)
    pred = min(max(pred, 0.01), 0.99)

    return float(pred)


# -------------------------------
# VOICE PREDICTION (FIXED)
# -------------------------------
def predict_voice(input_features):

    # Correct feature names (VERY IMPORTANT)
    feature_names = [
        'MDVP:Fo(Hz)','MDVP:Fhi(Hz)','MDVP:Flo(Hz)',
        'MDVP:Jitter(%)','MDVP:Jitter(Abs)',
        'MDVP:RAP','MDVP:PPQ','Jitter:DDP',
        'MDVP:Shimmer','MDVP:Shimmer(dB)',
        'Shimmer:APQ3','Shimmer:APQ5','MDVP:APQ',
        'Shimmer:DDA','NHR','HNR',
        'RPDE','DFA','spread1','spread2',
        'D2','PPE'
    ]

    df = pd.DataFrame([input_features], columns=feature_names)

    scaled = voice_scaler.transform(df)
    prob = voice_model.predict_proba(scaled)[0][1]

    # Clip extreme values
    prob = min(max(prob, 0.01), 0.99)

    return float(prob)


# -------------------------------
# FINAL FUSION (IMPROVED)
# -------------------------------
def predict_final(image_path, voice_features):

    hand_prob = predict_handwriting(image_path)
    voice_prob = predict_voice(voice_features)

    # Weighted fusion (handwriting more reliable)
    final_score = (0.4 * voice_prob) + (0.6 * hand_prob)

    result = final_prediction(final_score)

    # Confidence calculation
    confidence = final_score if result == "Parkinson" else (1 - final_score)

    return {
        "result": result,
        "confidence": round(confidence, 2),
        "handwriting_score": round(hand_prob, 3),
        "voice_score": round(voice_prob, 3),
        "final_score": round(final_score, 3)
    }


# -------------------------------
# TEST RUN
# -------------------------------
if __name__ == "__main__":

    image_path = r"C:\Users\Admin\parkinson-detection-system\data\parkinson.v1i.multiclass\test\Healthy105_png.rf.c08932b7b0bf59be202209d3916f0144.jpg"

    # 👉 BETTER: use real dataset sample instead of random
    import pandas as pd
    df = pd.read_csv(r"C:\Users\Admin\parkinson-detection-system\data\parkison_voice\parkinsons.data")

    sample = df.iloc[10]
    voice_features = sample.drop(['name', 'status']).values.tolist()

    print("\nActual Voice Label:", sample['status'])

    result = predict_final(image_path, voice_features)

    print("\n🔍 FINAL RESULT:")
    for key, value in result.items():
        print(f"{key}: {value}")