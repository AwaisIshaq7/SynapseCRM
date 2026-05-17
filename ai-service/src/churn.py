import os
import joblib
import numpy as np

# Resolve model files relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'churn_model.joblib')

# Load the trained RandomForest model & metrics on startup if present
model = None
model_metrics = None

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        metrics_path = os.path.join(BASE_DIR, 'models', 'model_metrics.joblib')
        if os.path.exists(metrics_path):
            model_metrics = joblib.load(metrics_path)
        print("[ML Model] Trained RandomForest Churn Prediction Model loaded successfully!")
    else:
        print("[ML Model] Churn Model file not found. Falling back to Heuristic Weighted Formula.")
except Exception as e:
    print(f"[ML Model] Error loading churn model: {e}. Falling back to Heuristic.")


def _clamp(value, minimum=0.0, maximum=1.0):
    return max(minimum, min(maximum, value))


def calculate_churn_risk(days_since_last_contact, avg_sentiment_score, interaction_count, interaction_frequency):
    """
    Calculate churn risk score for a customer using trained ML model if available.
    Returns churn score (0-1), risk level, and explanation.
    """
    global model
    
    # Check if model is successfully loaded
    if model is not None:
        try:
            # Prepare features matching the trained model column order
            features = np.array([[
                float(days_since_last_contact),
                float(avg_sentiment_score),
                float(interaction_count),
                float(interaction_frequency)
            ]])
            
            # Predict probability of churn (class 1)
            churn_probability = model.predict_proba(features)[0][1]
            churn_score = round(float(churn_probability), 4)
            
            # Formulate smart explanation based on key drivers
            reasons = []
            if days_since_last_contact > 30:
                reasons.append(f"infrequent contact ({days_since_last_contact} days ago)")
            if avg_sentiment_score < 0.1:
                reasons.append(f"negative sentiment ({avg_sentiment_score:.2f})")
            if interaction_count < 5:
                reasons.append(f"low interaction volume ({interaction_count} total)")

            if churn_score >= 0.7:
                risk_level = "high"
                explanation = "URGENT: " + (" and ".join(reasons) if reasons else "high churn risk patterns") + " indicate high churn risk"
            elif churn_score >= 0.3:
                risk_level = "medium"
                explanation = "Moderate engagement - " + (reasons[0] if reasons else "monitor closely") + " needs attention"
            else:
                risk_level = "low"
                explanation = "Healthy account - high engagement and positive sentiment trend"

            return {
                "churnScore": churn_score,
                "riskLevel": risk_level,
                "explanation": explanation,
                "modelType": "RandomForestML"
            }
        except Exception as e:
            print(f"ML Churn Prediction failed, falling back: {e}")
            
    # --- FALLBACK TO HEURISTIC FORMULA ---
    recency_risk = _clamp(days_since_last_contact / 60)
    sentiment_risk = _clamp((0.35 - avg_sentiment_score) / 1.35)
    volume_risk = _clamp((10 - interaction_count) / 10)
    frequency_risk = _clamp((0.3 - interaction_frequency) / 0.3)

    churn_score = round(_clamp(
        (recency_risk * 0.34)
        + (sentiment_risk * 0.32)
        + (volume_risk * 0.18)
        + (frequency_risk * 0.16)
    ), 4)

    if churn_score >= 0.7:
        risk_level = "high"
        explanation = "Low contact frequency and negative sentiment trend indicate high churn risk"
    elif churn_score >= 0.3:
        risk_level = "medium"
        explanation = "Moderate engagement levels - monitor closely and increase contact frequency"
    else:
        risk_level = "low"
        explanation = "Strong engagement and positive sentiment indicate healthy customer relationship"

    return {
        "churnScore": churn_score,
        "riskLevel": risk_level,
        "explanation": explanation,
        "modelType": "HeuristicWeighted"
    }


def get_model_info():
    """
    Return training information of the active model.
    """
    if model_metrics is not None:
        return {
            "status": "active",
            "model": "RandomForestClassifier",
            "accuracy": model_metrics.get("accuracy"),
            "features": ["days_since_last_contact", "avg_sentiment_score", "interaction_count", "interaction_frequency"],
            "featureImportances": model_metrics.get("feature_importances"),
            "samplesTrained": model_metrics.get("samples_trained")
        }
    return {
        "status": "fallback",
        "model": "HeuristicWeighted",
        "explanation": "Trained RandomForest model not loaded."
    }

def reload_model():
    """
    Reload the model and metrics dynamically from disk into memory.
    """
    global model, model_metrics
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            metrics_path = os.path.join(BASE_DIR, 'models', 'model_metrics.joblib')
            if os.path.exists(metrics_path):
                model_metrics = joblib.load(metrics_path)
            print("[ML Model] RandomForest model reloaded dynamically!")
            return True
    except Exception as e:
        print(f"[ML Model] Failed to reload model: {e}")
    return False
