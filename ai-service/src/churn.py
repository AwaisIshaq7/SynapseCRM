import numpy as np
from sklearn.linear_model import LogisticRegression

# ------------------------------------
# Train a simple logistic regression
# model on synthetic engagement data.
# In a real system this would be trained
# on historical CRM data.
# ------------------------------------

# Synthetic training data
# Features: [daysSinceLastContact, avgSentimentScore, interactionCount, interactionFrequency]
# Label: 1 = churned, 0 = retained

X_train = np.array([
    # High churn examples
    [60,  -0.6,  1,  0.02],
    [45,  -0.4,  2,  0.04],
    [90,  -0.7,  1,  0.01],
    [50,  -0.5,  2,  0.03],
    [75,  -0.3,  1,  0.02],
    [80,  -0.6,  1,  0.01],
    [55,  -0.8,  2,  0.03],

    # Low churn examples
    [5,    0.7,  15,  0.5],
    [3,    0.6,  20,  0.7],
    [7,    0.5,  12,  0.4],
    [2,    0.8,  25,  0.8],
    [10,   0.4,  10,  0.3],
    [4,    0.6,  18,  0.6],
    [6,    0.7,  14,  0.5],

    # Medium risk examples
    [20,   0.1,   6,  0.15],
    [25,  -0.1,   5,  0.12],
    [30,   0.0,   4,  0.10],
    [18,  -0.2,   5,  0.13],
    [22,   0.1,   6,  0.14],
])

y_train = np.array([
    1, 1, 1, 1, 1, 1, 1,  # high churn
    0, 0, 0, 0, 0, 0, 0,  # low churn
    0, 0, 0, 0, 0,         # medium (retained)
])

# Train the model
model = LogisticRegression(random_state=42)
model.fit(X_train, y_train)


def calculate_churn_risk(days_since_last_contact, avg_sentiment_score, interaction_count, interaction_frequency):
    """
    Calculate churn risk score for a customer.
    Returns churn score (0-1), risk level, and explanation.
    """
    features = np.array([[
        days_since_last_contact,
        avg_sentiment_score,
        interaction_count,
        interaction_frequency
    ]])

    # Get probability of churn (class 1)
    churn_score = round(float(model.predict_proba(features)[0][1]), 4)

    # Risk level classification
    if churn_score >= 0.7:
        risk_level = "high"
        explanation = "Low contact frequency and negative sentiment trend indicate high churn risk"
    elif churn_score >= 0.4:
        risk_level = "medium"
        explanation = "Moderate engagement levels — monitor closely and increase contact frequency"
    else:
        risk_level = "low"
        explanation = "Strong engagement and positive sentiment indicate healthy customer relationship"

    return {
        "churnScore": churn_score,
        "riskLevel": risk_level,
        "explanation": explanation
    }