#!/usr/bin/env python3
"""
Test Flask API endpoints for sentiment analysis and churn prediction.
Requires Flask server to be running on port 8000.
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def print_header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def test_health_endpoint():
    """Test /health endpoint."""
    print_header("HEALTH CHECK")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed")
            print(f"  Service: {data.get('service')}")
            print(f"  Status: {data.get('status')}")
            print(f"  Version: {data.get('version')}\n")
            return True
        else:
            print(f"❌ Health check failed with status {response.status_code}\n")
            return False
    except Exception as e:
        print(f"❌ Error connecting to Flask service: {e}")
        print(f"   Make sure Flask is running on {BASE_URL}\n")
        return False

def test_sentiment_endpoint():
    """Test /analyze endpoint."""
    print_header("SENTIMENT ANALYSIS API TESTS")
    
    test_cases = [
        {"text": "I love this product!", "expected": "positive"},
        {"text": "This is terrible", "expected": "negative"},
        {"text": "Nice weather today", "expected": "neutral"},
        {"text": "", "expected": "neutral"},
    ]
    
    results = []
    for i, test in enumerate(test_cases, 1):
        try:
            response = requests.post(
                f"{BASE_URL}/analyze",
                json=test,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                is_correct = data.get("sentiment") == test.get("expected")
                status = "✅" if is_correct else "⚠️"
                
                print(f"Test {i}: {status}")
                print(f"  Input: {test['text'][:40]}{'...' if len(test['text']) > 40 else ''}")
                print(f"  Result: {data.get('sentiment')} (score: {data.get('score')})")
                print(f"  Breakdown: Pos={data['breakdown']['positive']}, "
                      f"Neu={data['breakdown']['neutral']}, "
                      f"Neg={data['breakdown']['negative']}\n")
                
                results.append({"test": i, "passed": is_correct})
            else:
                print(f"Test {i}: ❌ HTTP {response.status_code}")
                print(f"  Response: {response.text}\n")
                results.append({"test": i, "passed": False})
        
        except Exception as e:
            print(f"Test {i}: ❌ Error: {e}\n")
            results.append({"test": i, "passed": False})
    
    passed = sum(1 for r in results if r.get("passed"))
    print(f"Sentiment API Results: {passed}/{len(results)} tests passed\n")
    return results

def test_churn_endpoint():
    """Test /churn-risk endpoint."""
    print_header("CHURN PREDICTION API TESTS")
    
    test_cases = [
        {
            "daysSinceLastContact": 5,
            "avgSentimentScore": 0.7,
            "interactionCount": 15,
            "interactionFrequency": 0.5,
            "expected_risk": "low"
        },
        {
            "daysSinceLastContact": 45,
            "avgSentimentScore": -0.5,
            "interactionCount": 2,
            "interactionFrequency": 0.04,
            "expected_risk": "high"
        },
        {
            "daysSinceLastContact": 20,
            "avgSentimentScore": 0.1,
            "interactionCount": 6,
            "interactionFrequency": 0.15,
            "expected_risk": "medium"
        },
    ]
    
    results = []
    for i, test in enumerate(test_cases, 1):
        try:
            payload = {k: v for k, v in test.items() if k != "expected_risk"}
            response = requests.post(
                f"{BASE_URL}/churn-risk",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                actual_risk = data.get("riskLevel")
                expected_risk = test.get("expected_risk")
                is_correct = actual_risk == expected_risk
                status = "✅" if is_correct else "⚠️"
                
                print(f"Test {i}: {status}")
                print(f"  Days Since Contact: {test['daysSinceLastContact']}")
                print(f"  Avg Sentiment: {test['avgSentimentScore']}")
                print(f"  Interaction Count: {test['interactionCount']}")
                print(f"  Risk Level: {actual_risk} (score: {data.get('churnScore')})")
                print(f"  Explanation: {data.get('explanation')}\n")
                
                results.append({"test": i, "passed": is_correct})
            else:
                print(f"Test {i}: ❌ HTTP {response.status_code}")
                print(f"  Response: {response.text}\n")
                results.append({"test": i, "passed": False})
        
        except Exception as e:
            print(f"Test {i}: ❌ Error: {e}\n")
            results.append({"test": i, "passed": False})
    
    passed = sum(1 for r in results if r.get("passed"))
    print(f"Churn API Results: {passed}/{len(results)} tests passed\n")
    return results

def test_api_performance():
    """Test API response times."""
    print_header("API PERFORMANCE TESTS")
    
    results = {}
    
    # Test 1: Sentiment endpoint performance
    print("Test 1: Sentiment Analysis API Response Time")
    sentiment_times = []
    
    for _ in range(10):
        try:
            start = time.time()
            response = requests.post(
                f"{BASE_URL}/analyze",
                json={"text": "I love this product!"},
                timeout=5
            )
            elapsed = (time.time() - start) * 1000
            if response.status_code == 200:
                sentiment_times.append(elapsed)
        except:
            pass
    
    if sentiment_times:
        avg_time = sum(sentiment_times) / len(sentiment_times)
        min_time = min(sentiment_times)
        max_time = max(sentiment_times)
        print(f"  Calls: 10 successful")
        print(f"  Average: {avg_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms, Max: {max_time:.2f}ms")
        status = "✅ PASS" if avg_time < 100 else "⚠️ SLOW"
        print(f"  {status} (target: <100ms)\n")
        results["sentiment_api"] = {"avg_ms": avg_time, "passed": avg_time < 100}
    
    # Test 2: Churn endpoint performance
    print("Test 2: Churn Prediction API Response Time")
    churn_times = []
    
    for _ in range(10):
        try:
            start = time.time()
            response = requests.post(
                f"{BASE_URL}/churn-risk",
                json={
                    "daysSinceLastContact": 30,
                    "avgSentimentScore": 0.2,
                    "interactionCount": 5,
                    "interactionFrequency": 0.1
                },
                timeout=5
            )
            elapsed = (time.time() - start) * 1000
            if response.status_code == 200:
                churn_times.append(elapsed)
        except:
            pass
    
    if churn_times:
        avg_time = sum(churn_times) / len(churn_times)
        min_time = min(churn_times)
        max_time = max(churn_times)
        print(f"  Calls: 10 successful")
        print(f"  Average: {avg_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms, Max: {max_time:.2f}ms")
        status = "✅ PASS" if avg_time < 100 else "⚠️ SLOW"
        print(f"  {status} (target: <100ms)\n")
        results["churn_api"] = {"avg_ms": avg_time, "passed": avg_time < 100}
    
    return results

def test_error_handling():
    """Test error handling."""
    print_header("ERROR HANDLING TESTS")
    
    results = []
    
    # Test 1: Missing required field
    print("Test 1: Missing required field in sentiment")
    try:
        response = requests.post(
            f"{BASE_URL}/analyze",
            json={},  # No 'text' field
            timeout=5
        )
        
        if response.status_code != 200:
            print(f"  ✅ Correctly rejected invalid request (HTTP {response.status_code})")
            print(f"     Error: {response.json().get('error')}\n")
            results.append(True)
        else:
            print(f"  ❌ Should have rejected invalid request\n")
            results.append(False)
    except Exception as e:
        print(f"  ❌ Error: {e}\n")
        results.append(False)
    
    # Test 2: Missing churn parameters
    print("Test 2: Missing required field in churn-risk")
    try:
        response = requests.post(
            f"{BASE_URL}/churn-risk",
            json={"daysSinceLastContact": 30},  # Missing other fields
            timeout=5
        )
        
        if response.status_code != 200:
            print(f"  ✅ Correctly rejected invalid request (HTTP {response.status_code})")
            print(f"     Error: {response.json().get('error')}\n")
            results.append(True)
        else:
            print(f"  ❌ Should have rejected invalid request\n")
            results.append(False)
    except Exception as e:
        print(f"  ❌ Error: {e}\n")
        results.append(False)
    
    passed = sum(1 for r in results if r)
    print(f"Error Handling Results: {passed}/{len(results)} tests passed\n")
    return results

def main():
    """Run all API tests."""
    print("\n" + "="*70)
    print("  FLASK API TEST SUITE")
    print("  Sentiment & Churn Prediction API Validation")
    print("="*70)
    
    # Check if service is running
    if not test_health_endpoint():
        print("\n⚠️ Flask service is not running!")
        print(f"   Start it with: python app.py (in ai-service directory)")
        sys.exit(1)
    
    all_results = {
        "sentiment_api": test_sentiment_endpoint(),
        "churn_api": test_churn_endpoint(),
        "performance": test_api_performance(),
        "error_handling": test_error_handling(),
    }
    
    # Summary
    print("="*70)
    print("  API TEST SUMMARY")
    print("="*70)
    
    sentiment_passed = sum(1 for r in all_results["sentiment_api"] if r.get("passed"))
    churn_passed = sum(1 for r in all_results["churn_api"] if r.get("passed"))
    error_passed = sum(1 for r in all_results["error_handling"] if r)
    
    print(f"\n📊 API Test Results:")
    print(f"  Sentiment Endpoint: {sentiment_passed}/4 ✅")
    print(f"  Churn Endpoint: {churn_passed}/3 ✅")
    print(f"  Error Handling: {error_passed}/2 ✅")
    
    perf = all_results["performance"]
    if perf.get("sentiment_api", {}).get("passed"):
        print(f"  Sentiment Performance: {perf['sentiment_api']['avg_ms']:.2f}ms ✅")
    if perf.get("churn_api", {}).get("passed"):
        print(f"  Churn Performance: {perf['churn_api']['avg_ms']:.2f}ms ✅")
    
    total_passed = sentiment_passed + churn_passed + error_passed
    total_tests = 4 + 3 + 2
    
    print(f"\n🎯 Total API Tests: {total_passed}/{total_tests} passed")
    
    if total_passed == total_tests:
        print("\n✅ ALL API TESTS PASSED - FLASK SERVICE READY")
    else:
        print("\n⚠️ SOME API TESTS FAILED")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
