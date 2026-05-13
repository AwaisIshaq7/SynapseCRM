const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/customers/:id/interactions', require('./routes/interactionRoutes'));
app.use('/api/interactions', require('./routes/standaloneInteractionRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rag', require('./routes/ragRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'SynapseCRM API is running' });
});

module.exports = app;