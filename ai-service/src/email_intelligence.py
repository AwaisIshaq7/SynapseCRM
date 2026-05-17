"""
CRM-tuned email sentiment, urgency detection, and priority scoring.
Uses VADER as base + domain lexicon boosts (rule-based "training" for sales email).
"""
import re
from src.sentiment import analyze_sentiment

URGENT_KEYWORDS = [
    "urgent", "asap", "immediately", "complaint", "complain", "cancel",
    "cancellation", "refund", "unhappy", "disappointed", "frustrated",
    "angry", "escalate", "legal", "lawsuit", "deadline", "overdue",
    "not working", "broken", "issue", "problem", "help needed",
]

NEGATIVE_KEYWORDS = [
    "unfortunately", "disappointed", "concern", "worried", "delay",
    "late", "missing", "never received", "poor", "bad experience",
    "unsatisfied", "regret", "mistake", "error", "failed",
]

POSITIVE_KEYWORDS = [
    "thank", "thanks", "great", "excellent", "happy", "pleased",
    "appreciate", "love", "excited", "interested", "renew", "upgrade",
    "looking forward", "wonderful", "perfect", "helpful",
]

MARKETING_SENDER_HINTS = ["noreply", "no-reply", "notifications", "newsletter", "linkedin", "promo"]

PRIORITY_ORDER = {"urgent": 4, "high": 3, "medium": 2, "low": 1}


def _normalize(text):
    return (text or "").strip()


def extract_email_body(full_text):
    """Strip 'Subject: ...' header block from stored interaction content."""
    text = _normalize(full_text)
    if not text:
        return "", ""
    match = re.match(r"^Subject:\s*(.+?)(?:\n\n|\n)([\s\S]*)$", text, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return "", text


def _keyword_hits(text, keywords):
    lowered = text.lower()
    return [kw for kw in keywords if kw in lowered]


def _is_likely_marketing(subject, body):
    combined = f"{subject} {body}".lower()
    return any(hint in combined for hint in MARKETING_SENDER_HINTS) and not _keyword_hits(
        combined, URGENT_KEYWORDS + NEGATIVE_KEYWORDS
    )


def compute_priority(sentiment_score, sentiment_label, urgency_count, days_since_contact=0, churn_score=0):
    """
    Map email signals to CRM priority tier.
    Returns (priority_label, priority_score 0-100).
    """
    score = 50  # baseline medium

    if sentiment_label == "negative":
        score += 25
    elif sentiment_label == "positive":
        score -= 15

    score += min(urgency_count * 12, 36)
    score += min(days_since_contact * 0.5, 15)
    score += (churn_score or 0) * 20

    if sentiment_score is not None:
        if sentiment_score <= -0.5:
            score += 20
        elif sentiment_score >= 0.5:
            score -= 10

    score = max(0, min(100, round(score)))

    if score >= 80 or (urgency_count >= 2 and sentiment_label == "negative"):
        priority = "urgent"
    elif score >= 60 or sentiment_label == "negative":
        priority = "high"
    elif score >= 35:
        priority = "medium"
    else:
        priority = "low"

    return priority, score


def analyze_email(subject="", body="", days_since_contact=0, churn_score=0):
    """
    Full email analysis for CRM: sentiment + priority + insight flags.
    """
    subject = _normalize(subject)
    body = _normalize(body)
    combined = f"{subject}\n{body}".strip()

    if not combined:
        return {
            "sentiment": "neutral",
            "score": 0.0,
            "breakdown": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
            "priority": "low",
            "priorityScore": 10,
            "urgencyFlags": [],
            "insight": "No email content to analyze.",
            "isMarketing": False,
        }

    if _is_likely_marketing(subject, body):
        return {
            "sentiment": "neutral",
            "score": 0.0,
            "breakdown": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
            "priority": "low",
            "priorityScore": 15,
            "urgencyFlags": [],
            "insight": "Likely promotional or notification email — low follow-up priority.",
            "isMarketing": True,
        }

    # Weight body more than subject for VADER
    analyze_text = body if len(body) > 20 else combined
    base = analyze_sentiment(analyze_text)

    urgent_hits = _keyword_hits(combined, URGENT_KEYWORDS)
    negative_hits = _keyword_hits(combined, NEGATIVE_KEYWORDS)
    positive_hits = _keyword_hits(combined, POSITIVE_KEYWORDS)

    adjusted_score = base["score"]
    if urgent_hits:
        adjusted_score -= 0.15 * min(len(urgent_hits), 3)
    if negative_hits:
        adjusted_score -= 0.08 * min(len(negative_hits), 4)
    if positive_hits:
        adjusted_score += 0.06 * min(len(positive_hits), 4)

    adjusted_score = max(-1.0, min(1.0, round(adjusted_score, 4)))

    if adjusted_score >= 0.05:
        label = "positive"
    elif adjusted_score <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    priority, priority_score = compute_priority(
        adjusted_score,
        label,
        len(urgent_hits),
        days_since_contact,
        churn_score,
    )

    urgency_flags = list(dict.fromkeys(urgent_hits + negative_hits[:3]))[:5]

    if label == "negative" and urgent_hits:
        insight = f"Negative tone with urgency signals ({', '.join(urgent_hits[:3])}). Respond within 24 hours."
    elif label == "negative":
        insight = "Customer sentiment is negative. Acknowledge concerns and propose a clear next step."
    elif label == "positive":
        insight = "Positive email — good opportunity to strengthen the relationship or upsell."
    elif urgent_hits:
        insight = f"Neutral tone but urgency detected ({', '.join(urgent_hits[:2])}). Prioritize a timely reply."
    else:
        insight = "Standard follow-up — no strong urgency or sentiment signals."

    return {
        "sentiment": label,
        "score": adjusted_score,
        "breakdown": base["breakdown"],
        "priority": priority,
        "priorityScore": priority_score,
        "urgencyFlags": urgency_flags,
        "insight": insight,
        "isMarketing": False,
    }
