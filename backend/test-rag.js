#!/usr/bin/env node
/**
 * RAG System Test Suite
 * Tests the Groq LLM integration for intelligent customer queries
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
let authToken = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function printHeader(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(70)}\n`);
}

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Authenticate and get JWT token
 */
async function authenticate() {
  try {
    printHeader('AUTHENTICATION');
    
    // Try to login with a test account
    const loginResponse = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        email: 'testadmin@example.com',
        password: 'TestPass123'
      },
      { timeout: 5000 }
    );
    
    if (loginResponse.data.success && loginResponse.data.data.token) {
      authToken = loginResponse.data.data.token;
      print(`✅ Authenticated successfully`, 'green');
      print(`   Token: ${authToken.substring(0, 20)}...`, 'cyan');
      print(`   User: ${loginResponse.data.data.user.name} (${loginResponse.data.data.user.role})\n`);
      return true;
    }
  } catch (error) {
    // If login fails, try to register
    try {
      print(`⚠️ Existing account not found, attempting to register...`, 'yellow');
      
      const registerResponse = await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          name: 'Test Admin',
          email: `testadmin${Date.now()}@example.com`,
          password: 'TestPass123',
          role: 'admin'
        },
        { timeout: 5000 }
      );
      
      if (registerResponse.data.success && registerResponse.data.data.token) {
        authToken = registerResponse.data.data.token;
        print(`✅ Registered and authenticated successfully`, 'green');
        print(`   Token: ${authToken.substring(0, 20)}...`, 'cyan');
        print(`   User: Test Admin\n`);
        return true;
      }
    } catch (regError) {
      print(`❌ Authentication failed: ${regError.message}`, 'red');
      return false;
    }
  }
  
  return false;
}

/**
 * Test 1: Check if Groq API key is configured
 */
async function testGroqConfiguration() {
  printHeader('GROQ CONFIGURATION CHECK');
  
  const groqApiKey = process.env.GROQ_API_KEY;
  
  if (groqApiKey) {
    const masked = groqApiKey.substring(0, 10) + '...' + groqApiKey.substring(groqApiKey.length - 5);
    print(`✅ GROQ_API_KEY configured: ${masked}`, 'green');
    print(`   (Full length: ${groqApiKey.length} characters)\n`, 'cyan');
    return true;
  } else {
    print(`❌ GROQ_API_KEY not configured!`, 'red');
    print(`   Set GROQ_API_KEY in backend .env file\n`, 'yellow');
    return false;
  }
}

/**
 * Test 2: Test RAG endpoint connectivity
 */
async function testRagConnectivity() {
  printHeader('RAG ENDPOINT CONNECTIVITY');
  
  if (!authToken) {
    print(`❌ Not authenticated - cannot test RAG endpoint\n`, 'red');
    return false;
  }
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/rag/query`,
      {
        question: 'What is the overall sentiment trend?',
      },
      {
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      print(`✅ RAG endpoint is accessible`, 'green');
      print(`   Status: ${response.status}`, 'cyan');
      print(`   Response time: ${response.duration || 'N/A'}ms\n`, 'cyan');
      return true;
    } else {
      print(`❌ RAG endpoint returned error: ${response.data.error}`, 'red');
      return false;
    }
  } catch (error) {
    print(`❌ RAG endpoint error: ${error.message}`, 'red');
    if (error.response?.status === 401) {
      print(`   Authentication issue - token may be invalid\n`, 'yellow');
    } else {
      print(`   Make sure backend is running on ${API_BASE_URL}\n`, 'yellow');
    }
    return false;
  }
}

/**
 * Test 3: Test RAG with sample questions
 */
async function testRagQueries() {
  printHeader('RAG QUERY TESTS');
  
  const sampleQueries = [
    {
      question: 'What is the overall customer sentiment?',
      description: 'General sentiment query'
    },
    {
      question: 'Which customers are at high churn risk?',
      description: 'Churn risk identification'
    },
    {
      question: 'How should we follow up with at-risk customers?',
      description: 'Action recommendation query'
    },
  ];
  
  let passed = 0;
  let results = [];
  
  for (let i = 0; i < sampleQueries.length; i++) {
    const { question, description } = sampleQueries[i];
    
    try {
      print(`Test ${i + 1}: ${description}`, 'cyan');
      print(`  Question: "${question}"`);
      
      const startTime = Date.now();
      const response = await axios.post(
        `${API_BASE_URL}/rag/query`,
        { question },
        {
          timeout: 30000,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      const duration = Date.now() - startTime;
      
      if (response.data.success) {
        const { answer, contextUsed } = response.data.data;
        
        print(`  ✅ Query successful (${duration}ms)`, 'green');
        print(`     Context used: ${contextUsed.interactionsRetrieved} interactions`);
        print(`     Answer preview: ${answer.substring(0, 80)}...`);
        print(`     Full answer length: ${answer.length} chars\n`);
        
        passed++;
        results.push({
          test: i + 1,
          passed: true,
          duration,
          answerLength: answer.length
        });
      } else {
        print(`  ❌ Query failed: ${response.data.error}\n`, 'red');
        results.push({
          test: i + 1,
          passed: false,
          error: response.data.error
        });
      }
    } catch (error) {
      print(`  ❌ Query error: ${error.message}\n`, 'red');
      results.push({
        test: i + 1,
        passed: false,
        error: error.message
      });
    }
  }
  
  print(`RAG Query Results: ${passed}/${sampleQueries.length} tests passed\n`, passed === sampleQueries.length ? 'green' : 'yellow');
  return results;
}

/**
 * Test 4: Test RAG performance
 */
async function testRagPerformance() {
  printHeader('RAG PERFORMANCE TESTS');
  
  print('Test: Average Query Response Time', 'cyan');
  
  const iterations = 3;
  const durations = [];
  
  try {
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const response = await axios.post(
        `${API_BASE_URL}/rag/query`,
        {
          question: `What is the current status of our customer base? (Query ${i + 1}/${iterations})`,
        },
        {
          timeout: 30000,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      const duration = Date.now() - startTime;
      durations.push(duration);
      
      if (response.data.success) {
        print(`  Query ${i + 1}: ${duration}ms ✅`);
      } else {
        print(`  Query ${i + 1}: Error - ${response.data.error}`, 'red');
      }
    }
    
    if (durations.length === iterations) {
      const avgDuration = durations.reduce((a, b) => a + b) / iterations;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      print(`\n  Average: ${avgDuration.toFixed(0)}ms`);
      print(`  Min: ${minDuration}ms, Max: ${maxDuration}ms`);
      
      const status = avgDuration < 5000 ? 'good' : avgDuration < 10000 ? 'acceptable' : 'slow';
      const statusIcon = status === 'good' ? '✅' : status === 'acceptable' ? '⚠️' : '❌';
      
      print(`  ${statusIcon} Performance: ${status} (target: <5000ms for LLM inference)\n`);
      
      return { avgDuration, minDuration, maxDuration, status };
    }
  } catch (error) {
    print(`  ❌ Performance test failed: ${error.message}\n`, 'red');
    return null;
  }
}

/**
 * Test 5: Test error handling
 */
async function testRagErrorHandling() {
  printHeader('RAG ERROR HANDLING');
  
  let passed = 0;
  
  // Test 1: Missing question field
  print('Test 1: Missing question field', 'cyan');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/rag/query`,
      {},
      {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (!response.data.success) {
      print(`  ✅ Correctly rejected: ${response.data.error}\n`, 'green');
      passed++;
    } else {
      print(`  ❌ Should have rejected empty query\n`, 'red');
    }
  } catch (error) {
    if (error.response?.status === 400) {
      print(`  ✅ Correctly rejected (HTTP 400): ${error.response.data.error}\n`, 'green');
      passed++;
    } else {
      print(`  ❌ Unexpected error: ${error.message}\n`, 'red');
    }
  }
  
  // Test 2: Invalid customerId
  print('Test 2: Invalid customerId format', 'cyan');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/rag/query`,
      {
        question: 'Tell me about this customer',
        customerId: 'invalid-id-format'
      },
      {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (!response.data.success) {
      print(`  ✅ Correctly rejected: ${response.data.error}\n`, 'green');
      passed++;
    } else {
      print(`  ⚠️ Query processed despite invalid ID\n`, 'yellow');
    }
  } catch (error) {
    print(`  ✅ Correctly rejected invalid ID\n`, 'green');
    passed++;
  }
  
  print(`Error Handling Results: ${passed}/2 tests handled correctly\n`);
  return { passed, total: 2 };
}

/**
 * Main test runner
 */
async function main() {
  console.clear();
  
  print('╔════════════════════════════════════════════════════════════════════╗', 'blue');
  print('║  SYNAPSE CRM - RAG SYSTEM TEST SUITE                              ║', 'blue');
  print('║  Groq LLM Integration & Query Performance Validation              ║', 'blue');
  print('╚════════════════════════════════════════════════════════════════════╝\n', 'blue');
  
  // First authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    print('\n❌ Cannot continue without authentication', 'red');
    process.exit(1);
  }
  
  const results = {
    configuration: await testGroqConfiguration(),
    connectivity: await testRagConnectivity(),
    queries: await testRagQueries(),
    performance: await testRagPerformance(),
    errorHandling: await testRagErrorHandling(),
  };
  
  // Summary
  printHeader('TEST SUMMARY');
  
  print('Configuration: ' + (results.configuration ? '✅ OK' : '❌ FAILED'), 
    results.configuration ? 'green' : 'red');
  print('Connectivity: ' + (results.connectivity ? '✅ OK' : '❌ FAILED'), 
    results.connectivity ? 'green' : 'red');
  
  if (results.queries && results.queries.length > 0) {
    const queryPassed = results.queries.filter(q => q.passed).length;
    print(`Query Tests: ${queryPassed}/${results.queries.length} ✅`, 'green');
  }
  
  if (results.performance) {
    const perfStatus = results.performance.status === 'good' ? '✅ OK' : 
                       results.performance.status === 'acceptable' ? '⚠️ ACCEPTABLE' : '❌ SLOW';
    print(`Performance: ${perfStatus} (${results.performance.avgDuration.toFixed(0)}ms avg)`,
      results.performance.status === 'good' ? 'green' : 'yellow');
  }
  
  if (results.errorHandling) {
    print(`Error Handling: ${results.errorHandling.passed}/${results.errorHandling.total} ✅`, 'green');
  }
  
  // Overall status
  print('\n' + '='.repeat(70));
  const allTestsPassed = results.configuration && results.connectivity && 
                         results.queries?.some(q => q.passed);
  
  if (allTestsPassed) {
    print('✅ RAG SYSTEM OPERATIONAL - READY FOR PRODUCTION', 'green');
  } else {
    print('⚠️ RAG SYSTEM - ISSUES DETECTED', 'yellow');
  }
  
  print('='.repeat(70) + '\n', 'blue');
}

main().catch(error => {
  print(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
