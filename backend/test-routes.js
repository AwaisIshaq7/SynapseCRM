const express = require('express');
const app = express();
app.use(express.json());

// Add the auth routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Test endpoint
app.get('/test', (req, res) => res.json({test: 'ok'}));

// Log all routes
console.log('Routes registered:');
app._router.stack.forEach(middleware => {
  if (middleware.route) {
    console.log('  Direct route:', middleware.route.path);
  } else if (middleware.name === 'router' && middleware.regexp) {
    console.log('  Router mounted at:', middleware.regexp);
  }
});

app.listen(5001, () => {
  console.log('✅ Test app running on 5001');
});

// Wait for the app to start
setTimeout(() => {
  const http = require('http');
  http.get('http://localhost:5001/api/auth/forgot-password', { headers: { 'Content-Type': 'application/json' } }, (res) => {
    console.log('Response code for /api/auth/forgot-password:', res.statusCode);
  }).on('error', console.error);
}, 1000);
