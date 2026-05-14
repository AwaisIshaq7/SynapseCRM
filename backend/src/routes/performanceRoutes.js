const express = require('express');
const router = express.Router();
const { getPerformanceReport, resetMetrics } = require('../middleware/performanceMonitor');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/performance/report
 * Get performance metrics (Admin only)
 */
router.get('/report', protect, authorize('admin', 'admin2'), (req, res) => {
  try {
    const report = getPerformanceReport();
    
    res.status(200).json({
      success: true,
      data: report,
      message: 'Performance report generated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/performance/reset
 * Reset performance metrics (Admin only)
 */
router.post('/reset', protect, authorize('admin'), (req, res) => {
  try {
    resetMetrics();
    
    res.status(200).json({
      success: true,
      message: 'Performance metrics reset successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/performance/health
 * Quick health check with basic metrics
 */
router.get('/health', (req, res) => {
  try {
    const report = getPerformanceReport();
    
    res.status(200).json({
      success: true,
      status: 'healthy',
      uptime: report.uptime,
      totalRequests: report.totalRequests,
      errorRate: report.errorRate,
      avgResponseTime: report.avgResponseTime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message,
    });
  }
});

module.exports = router;
