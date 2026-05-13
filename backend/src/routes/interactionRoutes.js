const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getInteractions,
  createInteraction,
  deleteInteraction,
} = require('../controllers/interactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getInteractions);
router.post('/', createInteraction);
router.delete('/:interactionId', deleteInteraction);

module.exports = router;
