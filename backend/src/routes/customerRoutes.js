const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} = require('../controllers/customerController');
const {
  analyzeCustomerEmails,
  getSuggestedResponse,
  getPriorityInbox,
  reanalyzeAll,
} = require('../controllers/emailIntelligenceController');
const { protect, authorize } = require('../middleware/auth');

// All routes below require login
router.use(protect);

router.get('/search', searchCustomers);
router.get('/priority-inbox', getPriorityInbox);
router.post('/reanalyze-emails', authorize('admin'), reanalyzeAll);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);
router.post('/:id/analyze-emails', analyzeCustomerEmails);
router.get('/:id/suggested-response', getSuggestedResponse);
router.put('/:id', updateCustomer);
// Allow admins and sales managers; controller will enforce ownership checks
router.delete('/:id', authorize('admin', 'sales_manager'), deleteCustomer);

module.exports = router;