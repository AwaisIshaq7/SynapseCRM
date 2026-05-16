const express = require('express');
const router = express.Router();
const { exportCustomersCSV, exportCustomersReport, exportInteractionsCSV, getReportSummary } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/customers/csv', exportCustomersCSV);
router.get('/customers/report', exportCustomersReport);
router.get('/interactions/csv', exportInteractionsCSV);
router.get('/summary', getReportSummary);

module.exports = router;
