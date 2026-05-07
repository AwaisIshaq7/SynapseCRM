const express = require('express');
const router = express.Router();
const { queryCustomerData, summarizeCustomer } = require('../controllers/ragController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/query', queryCustomerData);
router.post('/summarize/:customerId', summarizeCustomer);

module.exports = router;