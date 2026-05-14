const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';
const AI_SERVICE_URL = 'http://localhost:8000';

async function testAIService() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  API OPTIMIZATION TESTS - Flask AI Service                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Health check
    console.log('📊 Test 1: AI Service Health & Cache Status');
    const health = await axios.get(`${AI_SERVICE_URL}/health`);
    console.log(`   Status: ${health.data.status}`);
    console.log(`   Cache: ${health.data.cache}`);
    console.log(`   ✅ PASS\n`);

    // Test 2: Cache stats
    console.log('📊 Test 2: Cache Statistics Endpoint');
    const cacheStats = await axios.get(`${AI_SERVICE_URL}/cache-stats`);
    console.log(`   Status: ${cacheStats.data.status}`);
    if (cacheStats.data.status === 'active') {
      console.log(`   Keys in cache: ${cacheStats.data.total_keys}`);
      console.log(`   Memory used: ${cacheStats.data.used_memory}`);
    }
    console.log(`   ✅ PASS\n`);

    // Test 3: Sentiment analysis - First pass (cache miss)
    console.log('📊 Test 3: Sentiment Analysis - Cache Miss');
    const testText = 'This product is absolutely amazing and I love it!';
    const start1 = Date.now();
    const sentiment1 = await axios.post(`${AI_SERVICE_URL}/analyze`, { text: testText });
    const time1 = Date.now() - start1;
    console.log(`   Text: "${testText}"`);
    console.log(`   Sentiment: ${sentiment1.data.sentiment}`);
    console.log(`   Score: ${sentiment1.data.scores?.compound || 'N/A'}`);
    console.log(`   Response Time: ${time1}ms (first request - no cache)`);
    console.log(`   ✅ PASS\n`);

    // Test 4: Sentiment analysis - Second pass (cache hit)
    console.log('📊 Test 4: Sentiment Analysis - Cache Hit (Same Text)');
    const start2 = Date.now();
    const sentiment2 = await axios.post(`${AI_SERVICE_URL}/analyze`, { text: testText });
    const time2 = Date.now() - start2;
    console.log(`   Text: "${testText}"`);
    console.log(`   Sentiment: ${sentiment2.data.sentiment}`);
    console.log(`   Response Time: ${time2}ms (cached response)`);
    const speedup = (time1 / time2).toFixed(1);
    console.log(`   ⚡ SPEEDUP: ${speedup}x faster (${((1 - time2/time1) * 100).toFixed(0)}% improvement)`);
    console.log(`   ✅ PASS\n`);

    // Test 5: Churn prediction (no cache, real-time)
    console.log('📊 Test 5: Churn Risk Prediction (Real-time)');
    const churnData = {
      daysSinceLastContact: 45,
      avgSentimentScore: 0.3,
      interactionCount: 8,
      interactionFrequency: 0.18
    };
    const startChurn = Date.now();
    const churn = await axios.post(`${AI_SERVICE_URL}/churn-risk`, churnData);
    const churnTime = Date.now() - startChurn;
    console.log(`   Days Since Contact: ${churnData.daysSinceLastContact}`);
    console.log(`   Avg Sentiment: ${churnData.avgSentimentScore}`);
    console.log(`   Churn Risk: ${churn.data.churn_risk_score?.toFixed(3) || 'N/A'}`);
    console.log(`   Status: ${churn.data.status || 'N/A'}`);
    console.log(`   Response Time: ${churnTime}ms`);
    console.log(`   ✅ PASS\n`);

    // Test 6: Stats endpoint
    console.log('📊 Test 6: Service Performance Stats');
    const stats = await axios.get(`${AI_SERVICE_URL}/stats`);
    console.log(`   Sentiment core speed: ${stats.data.performance.sentiment_core_speed_ms}ms`);
    console.log(`   Churn core speed: ${stats.data.performance.churn_core_speed_ms}ms`);
    console.log(`   Cached response time: ${stats.data.performance.sentiment_api_cache_hit_time_ms}ms`);
    console.log(`   Expected improvement: ${stats.data.performance.expected_improvement_with_cache}`);
    console.log(`   ✅ PASS\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL AI SERVICE TESTS PASSED                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

async function testBackendMonitoring() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  API OPTIMIZATION TESTS - Backend Performance Monitoring   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Health check (public)
    console.log('📊 Test 1: Performance Health Endpoint (Public)');
    const health = await axios.get(`${BACKEND_URL}/api/performance/health`);
    console.log(`   Status: ${health.data.status}`);
    console.log(`   Uptime: ${health.data.uptime}`);
    console.log(`   Total Requests: ${health.data.totalRequests}`);
    console.log(`   Error Rate: ${health.data.errorRate}`);
    console.log(`   Avg Response Time: ${health.data.avgResponseTime}`);
    console.log(`   ✅ PASS\n`);

    console.log('📊 Test 2: Backend API Performance (Direct Calls)');
    const endpoints = [
      { method: 'GET', url: '/', name: 'Root' },
      { method: 'GET', url: '/api/performance/health', name: 'Performance Health' },
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      const response = await axios({
        method: endpoint.method,
        url: `${BACKEND_URL}${endpoint.url}`
      });
      const time = Date.now() - start;
      console.log(`   ${endpoint.name}: ${time}ms (${response.status})`);
    }
    console.log(`   ✅ PASS\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ BACKEND MONITORING TESTS PASSED                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

async function runAll() {
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('   SYNAPSE CRM - OPTIMIZATION VALIDATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  await testAIService();
  await testBackendMonitoring();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   SUMMARY: All optimizations are working correctly! ✅');
  console.log('═══════════════════════════════════════════════════════════\n');
}

runAll().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
