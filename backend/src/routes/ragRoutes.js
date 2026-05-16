const express = require('express');
const router = express.Router();
const { queryCustomerData, summarizeCustomer } = require('../controllers/ragController');
const { protect } = require('../middleware/auth');
const { refreshAllChurnScores } = require('../utils/churnRefresh');
const { generateDailyRiskReport, bulkSummarizeCustomers } = require('../services/ragBatchService');

router.use(protect);

router.post('/query', queryCustomerData);
router.post('/summarize/:customerId', summarizeCustomer);

// Manual trigger for testing
router.post('/refresh-churn', async (req, res) => {
  await refreshAllChurnScores();
  res.json({ success: true, message: 'Churn scores refreshed' });
});

router.get('/daily-risk-insights', async (req, res) => {
  try {
    const insights = await generateDailyRiskReport();
    res.json({ success: true, data: insights, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

router.post('/bulk-summarize', async (req, res) => {
  try {
    const { customerIds } = req.body;

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ success: false, data: null, error: 'customerIds must be a non-empty array' });
    }

    const summaries = await bulkSummarizeCustomers(customerIds);
    res.json({ success: true, data: summaries, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

module.exports = router;