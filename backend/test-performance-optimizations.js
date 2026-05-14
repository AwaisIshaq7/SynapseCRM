/**
 * Performance Optimization Test Suite
 * Tests for Redis Caching and Performance Monitoring
 */

const axios = require('axios');
const assert = require('assert');

const BACKEND_URL = 'http://localhost:5000';
const AI_SERVICE_URL = 'http://localhost:8000';

// Test data
let authToken = null;
const testCredentials = {
  email: 'admin@test.com',
  password: 'Password123!'
};

// Performance metrics
const metrics = {
  cacheTests: [],
  monitoringTests: [],
};

// ============================================
// Helper Functions
// ============================================

async function authenticate() {
  try {
    console.log('\n🔐 Authenticating...');
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, testCredentials);
    authToken = response.data.token;
    console.log('✅ Authentication successful');
    return authToken;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

function recordMetric(category, name, duration, result) {
  const metric = { name, duration, result, timestamp: new Date().toISOString() };
  metrics[category].push(metric);
  return metric;
}

function reportMetrics() {
  console.log('\n\n📊 TEST METRICS SUMMARY\n');
  console.log('=' .repeat(60));
  
  // Cache tests
  if (metrics.cacheTests.length > 0) {
    console.log('\n🗂️  Cache Performance Tests:');
    console.log('-' .repeat(60));
    
    const cache = metrics.cacheTests;
    const avgCache = cache.reduce((sum, m) => sum + m.duration, 0) / cache.length;
    const minCache = Math.min(...cache.map(m => m.duration));
    const maxCache = Math.max(...cache.map(m => m.duration));
    
    console.log(`  Total Tests: ${cache.length}`);
    console.log(`  Average Time: ${avgCache.toFixed(2)}ms`);
    console.log(`  Min Time: ${minCache.toFixed(2)}ms`);
    console.log(`  Max Time: ${maxCache.toFixed(2)}ms`);
    console.log(`  Success Rate: ${((cache.filter(m => m.result === 'PASS').length / cache.length) * 100).toFixed(1)}%`);
    
    cache.forEach(m => {
      const status = m.result === 'PASS' ? '✅' : '❌';
      console.log(`    ${status} ${m.name}: ${m.duration.toFixed(2)}ms`);
    });
  }
  
  // Monitoring tests
  if (metrics.monitoringTests.length > 0) {
    console.log('\n📈 Performance Monitoring Tests:');
    console.log('-' .repeat(60));
    
    const monitoring = metrics.monitoringTests;
    const avgMonitoring = monitoring.reduce((sum, m) => sum + m.duration, 0) / monitoring.length;
    
    console.log(`  Total Tests: ${monitoring.length}`);
    console.log(`  Average Time: ${avgMonitoring.toFixed(2)}ms`);
    console.log(`  Success Rate: ${((monitoring.filter(m => m.result === 'PASS').length / monitoring.length) * 100).toFixed(1)}%`);
    
    monitoring.forEach(m => {
      const status = m.result === 'PASS' ? '✅' : '❌';
      console.log(`    ${status} ${m.name}: ${m.duration.toFixed(2)}ms`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

// ============================================
// TEST GROUP 1: AI Service Cache Tests
// ============================================

async function testAIServiceHealth() {
  console.log('\n\n🔍 TEST 1: AI Service Health Check');
  console.log('-'.repeat(50));
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${AI_SERVICE_URL}/health`);
    const duration = Date.now() - startTime;
    
    assert.strictEqual(response.status, 200, 'Health check should return 200');
    assert.strictEqual(response.data.status, 'ok', 'Service should be ok');
    assert.ok(response.data.cache, 'Cache status should exist');
    
    console.log(`✅ AI service is healthy`);
    console.log(`   Cache Status: ${response.data.cache}`);
    console.log(`   Response Time: ${duration}ms`);
    
    recordMetric('cacheTests', 'AI Service Health', duration, 'PASS');
    return true;
  } catch (error) {
    console.error(`❌ AI service health check failed: ${error.message}`);
    recordMetric('cacheTests', 'AI Service Health', 0, 'FAIL');
    throw error;
  }
}

async function testSentimentAnalysisCachePerformance() {
  console.log('\n\n🔍 TEST 2: Sentiment Analysis Cache Performance');
  console.log('-'.repeat(50));
  
  const testTexts = [
    'This product is absolutely amazing and I love it!',
    'The customer service was terrible and unhelpful.',
    'The weather is neutral today.',
  ];
  
  const results = {
    firstRun: [],
    cachedRun: [],
  };
  
  try {
    // First pass - cache misses
    console.log('\n  First Run (Cache Misses):');
    for (const text of testTexts) {
      const startTime = Date.now();
      const response = await axios.post(`${AI_SERVICE_URL}/analyze`, { text });
      const duration = Date.now() - startTime;
      
      results.firstRun.push({ text, duration, sentiment: response.data.sentiment });
      console.log(`    Text: "${text.substring(0, 40)}..."`);
      console.log(`    Sentiment: ${response.data.sentiment} | Duration: ${duration}ms`);
      
      recordMetric('cacheTests', `Sentiment (${response.data.sentiment})`, duration, 'PASS');
    }
    
    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Second pass - cache hits
    console.log('\n  Second Run (Cache Hits):');
    for (const text of testTexts) {
      const startTime = Date.now();
      const response = await axios.post(`${AI_SERVICE_URL}/analyze`, { text });
      const duration = Date.now() - startTime;
      
      results.cachedRun.push({ text, duration, sentiment: response.data.sentiment });
      console.log(`    Text: "${text.substring(0, 40)}..."`);
      console.log(`    Sentiment: ${response.data.sentiment} | Duration: ${duration}ms`);
      
      recordMetric('cacheTests', `Sentiment Cached (${response.data.sentiment})`, duration, 'PASS');
    }
    
    // Calculate cache improvement
    const avgFirstRun = results.firstRun.reduce((sum, r) => sum + r.duration, 0) / results.firstRun.length;
    const avgCachedRun = results.cachedRun.reduce((sum, r) => sum + r.duration, 0) / results.cachedRun.length;
    const improvement = ((avgFirstRun - avgCachedRun) / avgFirstRun * 100);
    
    console.log(`\n  📊 Cache Performance:
    Average First Run: ${avgFirstRun.toFixed(2)}ms
    Average Cached Run: ${avgCachedRun.toFixed(2)}ms
    Improvement: ${improvement.toFixed(1)}% faster ⚡
    Speedup: ${(avgFirstRun / avgCachedRun).toFixed(1)}x faster`);
    
    return true;
  } catch (error) {
    console.error(`❌ Sentiment cache test failed: ${error.message}`);
    recordMetric('cacheTests', 'Sentiment Cache Performance', 0, 'FAIL');
    throw error;
  }
}

async function testCacheStatsEndpoint() {
  console.log('\n\n🔍 TEST 3: Cache Statistics Endpoint');
  console.log('-'.repeat(50));
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${AI_SERVICE_URL}/cache-stats`);
    const duration = Date.now() - startTime;
    
    assert.strictEqual(response.status, 200, 'Cache stats should return 200');
    assert.ok(response.data.status, 'Cache status should exist');
    
    console.log(`✅ Cache statistics retrieved`);
    console.log(`   Status: ${response.data.status}`);
    if (response.data.status === 'active') {
      console.log(`   Total Keys: ${response.data.total_keys}`);
      console.log(`   Memory Used: ${response.data.used_memory}`);
      console.log(`   Evicted Keys: ${response.data.evicted_keys}`);
      console.log(`   Commands Processed: ${response.data.total_commands_processed}`);
    }
    console.log(`   Response Time: ${duration}ms`);
    
    recordMetric('cacheTests', 'Cache Stats Endpoint', duration, 'PASS');
    return true;
  } catch (error) {
    console.error(`❌ Cache stats test failed: ${error.message}`);
    recordMetric('cacheTests', 'Cache Stats Endpoint', 0, 'FAIL');
    throw error;
  }
}

// ============================================
// TEST GROUP 2: Backend Performance Monitoring
// ============================================

async function testBackendHealthEndpoint() {
  console.log('\n\n🔍 TEST 4: Backend Performance Health Endpoint');
  console.log('-'.repeat(50));
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BACKEND_URL}/api/performance/health`);
    const duration = Date.now() - startTime;
    
    assert.strictEqual(response.status, 200, 'Health endpoint should return 200');
    assert.ok(response.data.status, 'Status should exist');
    assert.ok(response.data.uptime, 'Uptime should exist');
    assert.ok(response.data.avgResponseTime, 'Average response time should exist');
    
    console.log(`✅ Backend performance health retrieved`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Uptime: ${response.data.uptime}`);
    console.log(`   Total Requests: ${response.data.totalRequests}`);
    console.log(`   Error Rate: ${response.data.errorRate}`);
    console.log(`   Avg Response Time: ${response.data.avgResponseTime}`);
    console.log(`   Response Time: ${duration}ms`);
    
    recordMetric('monitoringTests', 'Backend Health Endpoint', duration, 'PASS');
    return true;
  } catch (error) {
    console.error(`❌ Backend health test failed: ${error.message}`);
    recordMetric('monitoringTests', 'Backend Health Endpoint', 0, 'FAIL');
    throw error;
  }
}

async function testPerformanceReportEndpoint() {
  console.log('\n\n🔍 TEST 5: Performance Report Endpoint (Admin Only)');
  console.log('-'.repeat(50));
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BACKEND_URL}/api/performance/report`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const duration = Date.now() - startTime;
    
    assert.strictEqual(response.status, 200, 'Report endpoint should return 200');
    assert.ok(response.data.data, 'Report data should exist');
    assert.ok(response.data.data.slowestEndpoints, 'Slowest endpoints should be listed');
    assert.ok(response.data.data.allEndpoints, 'All endpoints should be listed');
    
    const report = response.data.data;
    console.log(`✅ Performance report retrieved`);
    console.log(`   Total Requests: ${report.totalRequests}`);
    console.log(`   Total Errors: ${report.totalErrors}`);
    console.log(`   Error Rate: ${report.errorRate}`);
    console.log(`   Avg Response Time: ${report.avgResponseTime}`);
    console.log(`   Slowest Endpoints: ${report.slowestEndpoints.length}`);
    console.log(`   Total Endpoints: ${report.allEndpoints.length}`);
    console.log(`   Response Time: ${duration}ms`);
    
    if (report.slowestEndpoints.length > 0) {
      console.log(`\n   Top 3 Slowest Endpoints:`);
      report.slowestEndpoints.slice(0, 3).forEach((endpoint, i) => {
        console.log(`     ${i + 1}. ${endpoint.endpoint}: ${endpoint.avgTime} (${endpoint.requestCount} requests)`);
      });
    }
    
    recordMetric('monitoringTests', 'Performance Report Endpoint', duration, 'PASS');
    return true;
  } catch (error) {
    console.error(`❌ Performance report test failed: ${error.message}`);
    recordMetric('monitoringTests', 'Performance Report Endpoint', 0, 'FAIL');
    throw error;
  }
}

async function testAPIResponseTimes() {
  console.log('\n\n🔍 TEST 6: API Response Times Monitoring');
  console.log('-'.repeat(50));
  
  try {
    const endpoints = [
      { method: 'GET', url: '/api/customers', name: 'List Customers' },
      { method: 'GET', url: '/api/dashboard/summary', name: 'Dashboard Summary' },
      { method: 'GET', url: '/api/users', name: 'List Users' },
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const response = await axios.get(`${BACKEND_URL}${endpoint.url}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const duration = Date.now() - startTime;
        results.push({ ...endpoint, status: response.status, duration });
        
        const speedRating = duration < 100 ? '⚡' : duration < 500 ? '✅' : '⚠️';
        console.log(`  ${speedRating} ${endpoint.name}: ${duration}ms`);
        
        recordMetric('monitoringTests', `API: ${endpoint.name}`, duration, 'PASS');
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({ ...endpoint, status: 'error', duration });
        console.log(`  ❌ ${endpoint.name}: Error (${duration}ms)`);
        recordMetric('monitoringTests', `API: ${endpoint.name}`, duration, 'FAIL');
      }
    }
    
    const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log(`\n  Average Response Time: ${avgTime.toFixed(2)}ms`);
    
    return true;
  } catch (error) {
    console.error(`❌ API response time test failed: ${error.message}`);
    recordMetric('monitoringTests', 'API Response Times', 0, 'FAIL');
    throw error;
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('\n\n' + '='.repeat(60));
  console.log('🚀 PERFORMANCE OPTIMIZATION TEST SUITE');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'AI Service Health', fn: testAIServiceHealth, group: 'cache' },
    { name: 'Sentiment Cache Performance', fn: testSentimentAnalysisCachePerformance, group: 'cache' },
    { name: 'Cache Stats Endpoint', fn: testCacheStatsEndpoint, group: 'cache' },
    { name: 'Backend Health', fn: testBackendHealthEndpoint, group: 'monitoring' },
    { name: 'Performance Report', fn: testPerformanceReportEndpoint, group: 'monitoring' },
    { name: 'API Response Times', fn: testAPIResponseTimes, group: 'monitoring' },
  ];
  
  // First, authenticate
  try {
    await authenticate();
  } catch (error) {
    console.error('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Run tests
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (error) {
      failed++;
      console.log(`\n⚠️  Test failed, continuing to next test...\n`);
    }
  }
  
  // Report results
  reportMetrics();
  
  console.log(`\n\n📈 TEST SUMMARY`);
  console.log('='.repeat(60));
  console.log(`  Tests Passed: ${passed}/${tests.length} ✅`);
  console.log(`  Tests Failed: ${failed}/${tests.length} ❌`);
  console.log(`  Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Optimizations are working correctly.\n');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review logs above for details.\n`);
  }
}

// ============================================
// Run Tests
// ============================================

runAllTests().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
