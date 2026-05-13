from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize analyzer once — reused for all requests
analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text):
    """
    Analyze sentiment of a text string using VADER.
    Returns sentiment label, compound score, and breakdown.
    """
    if not text or len(text.strip()) == 0:
        return {
            "sentiment": "neutral",
            "score": 0.0,
            "breakdown": {"positive": 0.0, "neutral": 1.0, "negative": 0.0}
        }

    scores = analyzer.polarity_scores(text)
    compound = scores["compound"]

    # VADER standard thresholds
    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    return {
        "sentiment": label,
        "score": round(compound, 4),
        "breakdown": {
            "positive": round(scores["pos"], 4),
            "neutral": round(scores["neu"], 4),
            "negative": round(scores["neg"], 4)
        }
    }