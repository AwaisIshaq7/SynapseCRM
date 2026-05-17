const express = require('express');
const router = express.Router();
const { syncEmails, previewEmails } = require('../controllers/emailSyncController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'sales_manager'));

router.get('/preview', previewEmails);
router.post('/sync', syncEmails);

module.exports = router;
