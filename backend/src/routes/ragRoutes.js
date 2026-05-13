const express = require('express');
const router = express.Router();
const { queryCustomerData, summarizeCustomer } = require('../controllers/ragController');
const { protect } = require('../middleware/auth');
const { refreshAllChurnScores } = require('../utils/churnRefresh');

router.use(protect);

router.post('/query', queryCustomerData);
router.post('/summarize/:customerId', summarizeCustomer);

// Manual trigger for testing
router.post('/refresh-churn', async (req, res) => {
  await refreshAllChurnScores();
  res.json({ success: true, message: 'Churn scores refreshed' });
});

module.exports = router;