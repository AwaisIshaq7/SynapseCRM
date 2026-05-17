const express = require('express');
const router = express.Router();
const {
  getSummary,
  getSentimentTrend,
  getChurnDistribution,
  getAdminOverview,
  getKpiTrends,
  getSystemStatus,
  triggerModelRetrain,
  getPerformanceMetrics,
  exportPortfolioCSV,
  exportSystemJSON,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/sentiment-trend', getSentimentTrend);
router.get('/churn-distribution', getChurnDistribution);
router.get('/trends', getKpiTrends);
router.get('/performance', getPerformanceMetrics);
router.get('/export/portfolio', exportPortfolioCSV);
router.get('/export/system', authorize('admin'), exportSystemJSON);
router.get('/admin-overview', authorize('admin'), getAdminOverview);
router.get('/status', getSystemStatus);
router.post('/retrain', authorize('admin'), triggerModelRetrain);

module.exports = router;
