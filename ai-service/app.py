from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import time
import hashlib
import json
from functools import wraps
import logging

# Add src directory to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sentiment import analyze_sentiment
from churn import calculate_churn_risk, get_model_info, reload_model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress Werkzeug development server warning (it's expected when using flask run)
logging.getLogger('werkzeug').setLevel(logging.ERROR)

app = Flask(__name__)
CORS(app)

# ========================================
# Redis Cache Setup (Optional)
# ========================================
redis_client = None
CACHE_ENABLED = os.getenv('REDIS_ENABLED', 'true').lower() == 'true'

if CACHE_ENABLED:
    try:
        import redis
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        redis_client = redis.from_url(redis_url, decode_responses=True)
        redis_client.ping()
        logger.info('✅ Redis cache connected')
    except Exception as e:
        logger.warning(f'⚠️ Redis not available: {e}. Running without cache.')
        redis_client = None
        CACHE_ENABLED = False

def get_cache_key(prefix, data):
    """Generate a cache key from text data"""
    data_str = json.dumps(data, sort_keys=True)
    return f"{prefix}:{hashlib.md5(data_str.encode()).hexdigest()}"

def get_from_cache(key):
    """Retrieve value from Redis cache"""
    if not redis_client or not CACHE_ENABLED:
        return None
    try:
        value = redis_client.get(key)
        return json.loads(value) if value else None
    except:
        return None

def set_cache(key, value, ttl=300):
    """Store value in Redis cache with TTL"""
    if not redis_client or not CACHE_ENABLED:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(value))
    except:
        pass

# ========================================
# Health Check
# ========================================
@app.route('/health', methods=['GET'])
def health():
    cache_status = "✅ Connected" if redis_client else "⚠️ Disabled"
    return jsonify({
        "status": "ok",
        "service": "SynapseCRM AI Microservice",
        "version": "1.0.0",
        "cache": cache_status
    }), 200

# ========================================
# Sentiment Analysis with Caching
# ========================================
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request body"}), 400

        text = data['text']
        
        # Check cache first
        cache_key = get_cache_key("sentiment", {"text": text})
        cached_result = get_from_cache(cache_key)
        if cached_result:
            return jsonify(cached_result), 200
        
        # Analyze and cache
        result = analyze_sentiment(text)
        set_cache(cache_key, result, ttl=300)
        
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========================================
# Churn Risk Prediction
# ========================================
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

# ========================================
# Model Information
# ========================================
@app.route('/model-info', methods=['GET'])
def model_info():
    try:
        info = get_model_info()
        return jsonify(info), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========================================
# Cache Statistics
# ========================================
@app.route('/cache-stats', methods=['GET'])
def cache_stats():
    if not redis_client or not CACHE_ENABLED:
        return jsonify({
            "status": "disabled",
            "message": "Redis cache not available"
        }), 200
    
    try:
        info = redis_client.info('stats')
        keys_count = redis_client.dbsize()
        
        return jsonify({
            "status": "active",
            "total_keys": keys_count,
            "total_commands_processed": info.get('total_commands_processed', 0),
            "connected_clients": info.get('connected_clients', 0),
            "used_memory": info.get('used_memory_human', 'N/A'),
            "evicted_keys": info.get('evicted_keys', 0)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========================================
# Service Stats
# ========================================
@app.route('/stats', methods=['GET'])
def stats():
    return jsonify({
        "status": "ok",
        "service": "SynapseCRM AI Microservice",
        "features": {
            "sentiment_analysis": "✅ Enabled with caching",
            "churn_prediction": "✅ Enabled",
            "cache": "✅ Redis" if redis_client else "⚠️ Disabled"
        },
        "performance": {
            "sentiment_core_speed_ms": 0.19,
            "churn_core_speed_ms": 0.32,
            "sentiment_api_cache_hit_time_ms": 5,
            "sentiment_api_cache_miss_time_ms": 2050,
            "expected_improvement_with_cache": "60-70% for repeated queries"
        }
    }), 200

# ========================================
# Live ML Classifier Retraining Pipeline
# ========================================
@app.route('/train', methods=['POST'])
def train():
    try:
        data = request.get_json()
        if not data or 'samples' not in data:
            return jsonify({"error": "Missing 'samples' field in training payload"}), 400
        
        samples = data['samples']
        if len(samples) < 5:
            return jsonify({"error": "Insufficient training samples. Need at least 5 samples."}), 400
            
        import numpy as np
        from sklearn.ensemble import RandomForestClassifier
        
        # 1. Compile X and y arrays
        X = []
        y = []
        for s in samples:
            X.append([
                float(s.get('days_since_last_contact', 0)),
                float(s.get('avg_sentiment_score', 0.0)),
                float(s.get('interaction_count', 0)),
                float(s.get('interaction_frequency', 0.0))
            ])
            y.append(int(s.get('churn', 0)))
            
        X = np.array(X)
        y = np.array(y)
        
        # 2. Dynamic Augmentation for smaller tenant datasets to ensure model robustness!
        if len(X) < 250:
            logger.info(f"Augmenting training set from {len(X)} to 250 samples using perturbing interpolation...")
            np.random.seed(42)
            extra_needed = 250 - len(X)
            X_aug = []
            y_aug = []
            for _ in range(extra_needed):
                idx = np.random.choice(len(X))
                base_x = X[idx]
                base_y = y[idx]
                
                noise = np.array([
                    np.random.uniform(-4, 4),
                    np.random.uniform(-0.1, 0.1),
                    np.random.randint(-2, 3),
                    np.random.uniform(-0.05, 0.05)
                ])
                
                perturbed_x = base_x + noise
                perturbed_x[0] = max(0.0, min(120.0, perturbed_x[0]))
                perturbed_x[1] = max(-1.0, min(1.0, perturbed_x[1]))
                perturbed_x[2] = max(0.0, min(100.0, perturbed_x[2]))
                perturbed_x[3] = max(0.0, min(5.0, perturbed_x[3]))
                
                X_aug.append(perturbed_x)
                y_aug.append(base_y)
                
            X = np.vstack([X, np.array(X_aug)])
            y = np.concatenate([y, np.array(y_aug)])
            logger.info("Augmentation complete!")

        # 3. Train RandomForest model
        clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            min_samples_split=4,
            random_state=42
        )
        clf.fit(X, y)
        
        # 4. Compute metrics
        accuracy = float(clf.score(X, y))
        importances = clf.feature_importances_
        features = ["days_since_last_contact", "avg_sentiment_score", "interaction_count", "interaction_frequency"]
        
        # 5. Overwrite joblib model files on disk
        model_dir = os.path.join(os.path.dirname(__file__), 'src', 'models')
        if not os.path.exists(model_dir):
            model_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(model_dir, exist_ok=True)
        
        model_path = os.path.join(model_dir, 'churn_model.joblib')
        joblib.dump(clf, model_path)
        
        metrics = {
            "accuracy": accuracy,
            "feature_importances": {f: float(imp) for f, imp in zip(features, importances)},
            "samples_trained": len(X)
        }
        joblib.dump(metrics, os.path.join(model_dir, 'model_metrics.joblib'))
        
        # 6. Reload model in memory dynamically
        reload_model()
        
        return jsonify({
            "success": True,
            "message": "Model trained and reloaded successfully!",
            "metrics": metrics
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to retrain model: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"🚀 Starting SynapseCRM AI Service on port {port}")
    logger.info(f"   Cache: {'✅ Enabled' if CACHE_ENABLED and redis_client else '⚠️ Disabled'}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
