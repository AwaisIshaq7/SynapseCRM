const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getInteractions,
  createInteraction,
  deleteInteraction,
} = require('../controllers/interactionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getInteractions);
router.post('/', createInteraction);
// Only admins can delete interactions via the API — UI also hides this action.
// Allow admins and sales managers (controller enforces ownership checks)
router.delete('/:interactionId', authorize('admin', 'sales_manager'), deleteInteraction);

module.exports = router;
