const express = require('express');
const router = express.Router();
const {
  getSummary,
  getSentimentTrend,
  getChurnDistribution,
  getAdminOverview,
  getKpiTrends,
  getSystemHealth,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/sentiment-trend', getSentimentTrend);
router.get('/churn-distribution', getChurnDistribution);
router.get('/trends', getKpiTrends);
router.get('/admin-overview', authorize('admin'), getAdminOverview);
router.get('/system-health', getSystemHealth);

module.exports = router;
