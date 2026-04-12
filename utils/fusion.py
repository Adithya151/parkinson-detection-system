def fusion_score(voice_prob, hand_prob):
    # Give more importance to handwriting (CNN is stronger)
    return (0.4 * voice_prob) + (0.6 * hand_prob)

def final_prediction(score):
    return "Parkinson" if score > 0.5 else "Healthy"