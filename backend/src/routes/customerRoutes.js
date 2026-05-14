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
const { protect, authorize } = require('../middleware/auth');

// All routes below require login
router.use(protect);

router.get('/search', searchCustomers);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer); // Admin only

module.exports = router;