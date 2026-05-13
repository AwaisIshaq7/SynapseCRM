from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add src directory to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sentiment import analyze_sentiment
from churn import calculate_churn_risk

app = Flask(__name__)
CORS(app)  # Allow requests from Node.js backend


# ------------------------------------
# Health Check
# ------------------------------------
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "SynapseCRM AI Microservice",
        "version": "1.0.0"
    }), 200


# ------------------------------------
# Sentiment Analysis
# POST /analyze
# Body: { "text": "string" }
# ------------------------------------
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request body"}), 400

        text = data['text']
        result = analyze_sentiment(text)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------------------------
# Churn Risk Prediction
# POST /churn-risk
# Body: { daysSinceLastContact, avgSentimentScore, interactionCount, interactionFrequency }
# ------------------------------------
@app.route('/churn-risk', methods=['POST'])
def churn_risk():
    try:
        data = request.get_json()

        required_fields = ['daysSinceLastContact', 'avgSentimentScore', 'interactionCount', 'interactionFrequency']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        result = calculate_churn_risk(
            days_since_last_contact=data['daysSinceLastContact'],
            avg_sentiment_score=data['avgSentimentScore'],
            interaction_count=data['interactionCount'],
            interaction_frequency=data['interactionFrequency']
        )

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
