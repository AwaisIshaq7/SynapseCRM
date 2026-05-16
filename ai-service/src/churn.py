def _clamp(value, minimum=0.0, maximum=1.0):
    return max(minimum, min(maximum, value))


def calculate_churn_risk(days_since_last_contact, avg_sentiment_score, interaction_count, interaction_frequency):
    """
    Calculate churn risk score for a customer.
    Returns churn score (0-1), risk level, and explanation.
    """
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
        "explanation": explanation
    }
