const express = require('express');
const router = express.Router();
const {
  getSummary,
  getSentimentTrend,
  getChurnDistribution,
  getKPITrends,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/sentiment-trend', getSentimentTrend);
router.get('/churn-distribution', getChurnDistribution);
router.get('/trends', getKPITrends);

module.exports = router;