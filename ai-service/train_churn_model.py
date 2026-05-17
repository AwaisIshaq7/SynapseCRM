import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

def generate_synthetic_data(num_samples=6000):
    """
    Generate realistic synthetic customer CRM data for churn classification.
    Features:
    - days_since_last_contact (0 to 90 days)
    - avg_sentiment_score (-1.0 to 1.0)
    - interaction_count (0 to 30)
    - interaction_frequency (0.0 to 1.0 per day)
    """
    np.random.seed(42)
    
    # 1. Generate feature distributions
    days_since_last_contact = np.random.uniform(0, 90, num_samples)
    avg_sentiment_score = np.random.uniform(-1.0, 1.0, num_samples)
    interaction_count = np.random.randint(0, 30, num_samples)
    interaction_frequency = np.random.uniform(0.0, 1.0, num_samples)
    
    # 2. Heuristics for realistic label mapping
    # Probability score based on weighted formula + random noise
    p_churn = (
        (days_since_last_contact / 90) * 0.40 +
        ((1.0 - avg_sentiment_score) / 2.0) * 0.35 +
        ((30 - interaction_count) / 30) * 0.15 +
        (1.0 - interaction_frequency) * 0.10
    )
    
    # Add noise to make it realistic
    noise = np.random.normal(0, 0.08, num_samples)
    p_churn_with_noise = np.clip(p_churn + noise, 0, 1)
    
    # Binary label: 1 if churned/at_risk, 0 if active/healthy
    churn_labels = (p_churn_with_noise >= 0.55).astype(int)
    
    # Create pandas DataFrame
    df = pd.DataFrame({
        'days_since_last_contact': days_since_last_contact,
        'avg_sentiment_score': avg_sentiment_score,
        'interaction_count': interaction_count,
        'interaction_frequency': interaction_frequency,
        'churn': churn_labels
    })
    
    print(f"Generated synthetic dataset with shape: {df.shape}")
    print(f"Churn class distribution:\n{df['churn'].value_counts(normalize=True)}")
    return df

def train_model():
    df = generate_synthetic_data()
    
    # Features and Labels
    X = df[['days_since_last_contact', 'avg_sentiment_score', 'interaction_count', 'interaction_frequency']]
    y = df['churn']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Train Random Forest Classifier
    print("Training RandomForest model...")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        min_samples_split=5,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    report = classification_report(y_test, y_pred)
    print("\n--- CLASSIFICATION REPORT ---")
    print(report)
    
    # Feature Importances
    importances = model.feature_importances_
    features = X.columns
    print("\n--- FEATURE IMPORTANCES ---")
    for f, imp in zip(features, importances):
        print(f"{f}: {imp:.4f}")
        
    # Ensure save directory exists
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'churn_model.joblib')
    joblib.dump(model, model_path)
    print(f"\nModel successfully saved to: {model_path}")
    
    # Save training metrics for app dashboard verification
    metrics = {
        "accuracy": float(model.score(X_test, y_test)),
        "feature_importances": {f: float(imp) for f, imp in zip(features, importances)},
        "samples_trained": len(df)
    }
    joblib.dump(metrics, os.path.join(model_dir, 'model_metrics.joblib'))
    print("Model metrics saved successfully.")

if __name__ == '__main__':
    train_model()
