import librosa
import numpy as np

def extract_features(audio_path):

    y, sr = librosa.load(audio_path, duration=3, offset=0.5)

    # MFCC features (common for voice)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=22)

    mfcc_mean = np.mean(mfcc.T, axis=0)

    return mfcc_mean.tolist()