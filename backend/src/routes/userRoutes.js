const express = require('express');
const router = express.Router();
const {
  updatePreferences,
  updateUsageLog,
  getUsers,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.put('/preferences', updatePreferences);
router.put('/usage-log', updateUsageLog);
router.get('/', authorize('admin'), getUsers);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;