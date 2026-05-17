const express = require('express');
const router = express.Router();
const {
  updatePreferences,
  updateUsageLog,
  getUsers,
  sendAdminMessage,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.put('/preferences', updatePreferences);
router.put('/usage-log', updateUsageLog);
router.get('/', authorize('admin'), getUsers);
router.post('/:id/message', authorize('admin'), sendAdminMessage);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;