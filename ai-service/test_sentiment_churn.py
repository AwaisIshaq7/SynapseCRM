#!/usr/bin/env python3
"""
Comprehensive test suite for sentiment analysis and churn prediction.
Tests core functionality without requiring the Flask server to be running.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sentiment import analyze_sentiment
from churn import calculate_churn_risk
import json
from datetime import datetime

def print_header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def test_sentiment_analysis():
    """Test VADER sentiment analysis with various inputs."""
    print_header("SENTIMENT ANALYSIS TESTS")
    
    test_cases = [
        ("I absolutely love this product! It's amazing!", "positive"),
        ("This is terrible and I hate it", "negative"),
        ("The weather is nice today", "neutral"),
        ("Good job on the project", "positive"),
        ("Disappointed with the service", "negative"),
        ("Meeting scheduled for tomorrow", "neutral"),
        ("This is the best experience ever!", "positive"),
        ("Worst customer service I've ever seen", "negative"),
        ("", "neutral"),  # Empty text
        ("Not bad at all", "positive"),
    ]
    
    results = []
    for i, (text, expected) in enumerate(test_cases, 1):
        result = analyze_sentiment(text)
        is_correct = result["sentiment"] == expected
        status = "✅ PASS" if is_correct else "❌ FAIL"
        
        print(f"Test {i}: {status}")
        print(f"  Input: {text[:50]}{'...' if len(text) > 50 else ''}")
        print(f"  Expected: {expected}, Got: {result['sentiment']}")
        print(f"  Score: {result['score']}")
        print(f"  Breakdown: Pos={result['breakdown']['positive']}, "
              f"Neu={result['breakdown']['neutral']}, "
              f"Neg={result['breakdown']['negative']}\n")
        
        results.append({
            "test": i,
            "input": text,
            "expected": expected,
            "actual": result["sentiment"],
            "score": result["score"],
            "passed": is_correct
        })
    
    passed = sum(1 for r in results if r["passed"])
    print(f"\nSentiment Analysis Results: {passed}/{len(results)} tests passed")
    return results

def test_churn_prediction():
    """Test logistic regression churn prediction."""
    print_header("CHURN PREDICTION TESTS")
    
    test_cases = [
        # (daysSinceLastContact, avgSentimentScore, interactionCount, interactionFrequency, expected_risk)
        (5, 0.7, 15, 0.5, "low"),         # Recent, positive, high frequency
        (45, -0.5, 2, 0.04, "high"),      # Long time, negative, low frequency
        (20, 0.1, 6, 0.15, "medium"),     # Moderate risk
        (1, 0.8, 20, 0.7, "low"),         # Very recent, very positive
        (90, -0.7, 1, 0.01, "high"),      # Very old, very negative
        (30, 0.0, 5, 0.1, "medium"),      # Borderline case
    ]
    
    results = []
    for i, (days, sentiment, count, freq, expected) in enumerate(test_cases, 1):
        result = calculate_churn_risk(
            days_since_last_contact=days,
            avg_sentiment_score=sentiment,
            interaction_count=count,
            interaction_frequency=freq
        )
        
        is_correct = result["riskLevel"] == expected
        status = "✅ PASS" if is_correct else "❌ FAIL"
        
        print(f"Test {i}: {status}")
        print(f"  Input: days={days}, sentiment={sentiment}, count={count}, freq={freq}")
        print(f"  Expected Risk: {expected}, Got: {result['riskLevel']}")
        print(f"  Churn Score: {result['churnScore']}")
        print(f"  Explanation: {result['explanation']}\n")
        
        results.append({
            "test": i,
            "input": f"days={days}, sentiment={sentiment}, count={count}, freq={freq}",
            "expected": expected,
            "actual": result["riskLevel"],
            "score": result["churnScore"],
            "passed": is_correct
        })
    
    passed = sum(1 for r in results if r["passed"])
    print(f"\nChurn Prediction Results: {passed}/{len(results)} tests passed")
    return results

def test_edge_cases():
    """Test edge cases and boundary conditions."""
    print_header("EDGE CASE TESTS")
    
    results = []
    
    # Test 1: Extreme sentiment values
    print("Test 1: Extreme sentiment values")
    try:
        result = analyze_sentiment("😊😊😊 " * 10)
        print(f"  ✅ Handled emoji-heavy text: score={result['score']}\n")
        results.append({"test": 1, "passed": True})
    except Exception as e:
        print(f"  ❌ Failed: {e}\n")
        results.append({"test": 1, "passed": False})
    
    # Test 2: Churn with zero interactions
    print("Test 2: Churn with zero interactions")
    try:
        result = calculate_churn_risk(60, -0.5, 0, 0.0)
        print(f"  ✅ Handled zero interactions: score={result['churnScore']}\n")
        results.append({"test": 2, "passed": True})
    except Exception as e:
        print(f"  ❌ Failed: {e}\n")
        results.append({"test": 2, "passed": False})
    
    # Test 3: Very long text
    print("Test 3: Very long text (1000+ words)")
    try:
        long_text = "This is good. " * 100
        result = analyze_sentiment(long_text)
        print(f"  ✅ Handled long text: score={result['score']}\n")
        results.append({"test": 3, "passed": True})
    except Exception as e:
        print(f"  ❌ Failed: {e}\n")
        results.append({"test": 3, "passed": False})
    
    # Test 4: Special characters
    print("Test 4: Special characters in text")
    try:
        special_text = "Great! @#$%^&*() Very good!!!"
        result = analyze_sentiment(special_text)
        print(f"  ✅ Handled special characters: sentiment={result['sentiment']}\n")
        results.append({"test": 4, "passed": True})
    except Exception as e:
        print(f"  ❌ Failed: {e}\n")
        results.append({"test": 4, "passed": False})
    
    passed = sum(1 for r in results if r["passed"])
    print(f"Edge Case Results: {passed}/{len(results)} tests passed")
    return results

def test_performance():
    """Test performance metrics."""
    print_header("PERFORMANCE TESTS")
    
    import time
    
    results = {}
    
    # Performance Test 1: Sentiment analysis speed
    print("Performance Test 1: Sentiment Analysis Speed")
    text = "This is a great product and I love it very much"
    iterations = 100
    
    start = time.time()
    for _ in range(iterations):
        analyze_sentiment(text)
    elapsed = time.time() - start
    avg_time = elapsed / iterations * 1000  # Convert to ms
    
    print(f"  Analyzed {iterations} texts in {elapsed:.3f}s")
    print(f"  Average time per analysis: {avg_time:.2f}ms")
    status = "✅ PASS" if avg_time < 10 else "⚠️ SLOW"
    print(f"  {status} (target: <10ms, actual: {avg_time:.2f}ms)\n")
    results["sentiment_speed"] = {"avg_ms": avg_time, "passed": avg_time < 10}
    
    # Performance Test 2: Churn prediction speed
    print("Performance Test 2: Churn Prediction Speed")
    iterations = 100
    
    start = time.time()
    for _ in range(iterations):
        calculate_churn_risk(30, 0.2, 5, 0.1)
    elapsed = time.time() - start
    avg_time = elapsed / iterations * 1000
    
    print(f"  Predicted churn {iterations} times in {elapsed:.3f}s")
    print(f"  Average time per prediction: {avg_time:.2f}ms")
    status = "✅ PASS" if avg_time < 5 else "⚠️ SLOW"
    print(f"  {status} (target: <5ms, actual: {avg_time:.2f}ms)\n")
    results["churn_speed"] = {"avg_ms": avg_time, "passed": avg_time < 5}
    
    return results

def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("  SYNAPSE CRM - AI SERVICE TEST SUITE")
    print("  Sentiment Analysis & Churn Prediction Validation")
    print("="*70)
    
    all_results = {
        "timestamp": datetime.now().isoformat(),
        "tests": {
            "sentiment": test_sentiment_analysis(),
            "churn": test_churn_prediction(),
            "edge_cases": test_edge_cases(),
            "performance": test_performance()
        }
    }
    
    # Summary
    print("\n" + "="*70)
    print("  TEST SUMMARY")
    print("="*70)
    
    sentiment_pass = sum(1 for t in all_results["tests"]["sentiment"] if t.get("passed"))
    churn_pass = sum(1 for t in all_results["tests"]["churn"] if t.get("passed"))
    edge_pass = sum(1 for t in all_results["tests"]["edge_cases"] if t.get("passed"))
    
    print(f"\n📊 Overall Results:")
    print(f"  Sentiment Tests: {sentiment_pass}/10 ✅")
    print(f"  Churn Tests: {churn_pass}/6 ✅")
    print(f"  Edge Cases: {edge_pass}/4 ✅")
    print(f"  Performance: Measured above ✅")
    
    total_passed = sentiment_pass + churn_pass + edge_pass
    total_tests = 10 + 6 + 4
    
    print(f"\n🎯 Total: {total_passed}/{total_tests} tests passed ({total_passed*100//total_tests}%)")
    
    if total_passed == total_tests:
        print("\n✅ ALL TESTS PASSED - AI SERVICE READY FOR PRODUCTION")
    else:
        print("\n⚠️ SOME TESTS FAILED - REVIEW REQUIRED")
    
    print("\n" + "="*70 + "\n")
    
    return all_results

if __name__ == "__main__":
    results = main()
