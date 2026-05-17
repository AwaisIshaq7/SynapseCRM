const Customer = require('../models/Customer');
const {
  reanalyzeCustomerEmails,
  reanalyzeAllCustomers,
  getSuggestedResponse,
  getPriorityInbox,
} = require('../services/emailIntelligenceService');

const assertCustomerAccess = async (customerId, user) => {
  const customer = await Customer.findById(customerId);
  if (!customer) return { error: 'Customer not found', status: 404 };
  if (user.role === 'sales_manager') {
    const assigned = customer.assignedTo?.toString();
    if (assigned !== user._id.toString()) {
      return { error: 'Access denied', status: 403 };
    }
  }
  return { customer };
};

exports.analyzeCustomerEmails = async (req, res) => {
  try {
    const check = await assertCustomerAccess(req.params.id, req.user);
    if (check.error) return res.status(check.status).json({ success: false, error: check.error });

    const result = await reanalyzeCustomerEmails(req.params.id);
    res.status(200).json({
      success: true,
      data: {
        message: `Analyzed ${result.updated} email(s)`,
        updated: result.updated,
        customer: result.customer,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSuggestedResponse = async (req, res) => {
  try {
    const check = await assertCustomerAccess(req.params.id, req.user);
    if (check.error) return res.status(check.status).json({ success: false, error: check.error });

    const data = await getSuggestedResponse(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPriorityInbox = async (req, res) => {
  try {
    const customers = await getPriorityInbox(req.user);
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.reanalyzeAll = async (req, res) => {
  try {
    const stats = await reanalyzeAllCustomers();
    res.status(200).json({
      success: true,
      data: { message: 'Email sentiment and priorities updated', ...stats },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
