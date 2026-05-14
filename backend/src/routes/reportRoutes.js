const express = require('express');
const router = express.Router();
const { exportDashboardPDF } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.post('/export/dashboard', protect, exportDashboardPDF);

module.exports = router;
