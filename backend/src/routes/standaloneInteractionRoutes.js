const express = require('express');
const router = express.Router();
const { deleteInteraction } = require('../controllers/interactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.delete('/:interactionId', deleteInteraction);

module.exports = router;