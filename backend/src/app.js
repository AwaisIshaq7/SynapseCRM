const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { performanceMonitor } = require('./middleware/performanceMonitor');

dotenv.config();

const app = express();

// CORS — allow local dev and Vercel production
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://synapsecrm.vercel.app',
  ],
  credentials: true,
}));

app.use(express.json());

// ✅ Performance Monitoring Middleware (tracks all requests)
app.use(performanceMonitor());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/customers/:id/interactions', require('./routes/interactionRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rag', require('./routes/ragRoutes'));
app.use('/api/performance', require('./routes/performanceRoutes'));  // ✅ Performance monitoring
app.use('/api/notifications', require('./routes/notificationRoutes'));  // ✅ Notifications
app.use('/api/reports', require('./routes/reportRoutes'));  // ✅ Report export

app.get('/', (req, res) => {
  res.json({ message: 'SynapseCRM API is running' });
});

module.exports = app;
