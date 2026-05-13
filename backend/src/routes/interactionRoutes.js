const {
  getInteractions,
  createInteraction,
} = require('../controllers/interactionController');

const { deleteInteraction } = require('../controllers/interactionController');

const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives access to :id from parent
const {
  getInteractions,
  createInteraction,
} = require('../controllers/interactionController');
const { deleteInteraction } = require('../controllers/interactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getInteractions);
router.post('/', createInteraction);

module.exports = router;
