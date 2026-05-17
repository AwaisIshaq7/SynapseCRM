const express = require('express');
const router = express.Router();
const { previewEmails } = require('../controllers/emailSyncController');
const {
  listMailbox,
  getEmail,
  replyToEmail,
  syncEmails,
  getConfigStatus,
} = require('../controllers/emailMailboxController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'sales_manager'));

router.get('/config-status', getConfigStatus);
router.get('/mailbox', listMailbox);
router.post('/sync', syncEmails);
router.post('/reply', replyToEmail);
router.get('/preview', previewEmails);
router.get('/:id', getEmail);

module.exports = router;
