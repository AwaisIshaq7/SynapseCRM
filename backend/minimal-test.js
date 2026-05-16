const express = require('express');
const app = express();

app.use(express.json());

// Directly create a test router with a test handler
const testRouter = express.Router();
testRouter.post('/forgot-password', (req, res) => {
  console.log('Test handler called');
  res.json({ message: 'Test forgot-password endpoint' });
});

app.use('/api/auth', testRouter);

app.listen(5001, () => {
  console.log('Test app on 5001');
});

// Make a test request after a delay
setTimeout(() => {
  const http = require('http');
  http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/forgot-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    console.log('Response status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
      process.exit(0);
    });
  }).on('error', (e) => {
    console.error('Error:', e.message);
    process.exit(1);
  }).write('{}');
}, 500);
