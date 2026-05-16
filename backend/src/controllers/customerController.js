const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');

exports.getCustomers = async (req, res) => {
  try {
    const { status, search } = req.query;
    let filter = {};

    if (req.user.role === 'sales_manager') {
      filter.assignedTo = req.user._id;
    }

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedTo', 'name email');

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    if (
      req.user.role === 'sales_manager' &&
      customer.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, status, assignedTo } = req.body;

    const customer = await Customer.create({
      name,
      email,
      phone,
      company,
      status,
      assignedTo: req.user.role === 'sales_manager' ? req.user._id : (assignedTo || req.user._id),
    });

    res.status(201).json({ success: true, data: customer, message: 'Customer created successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    if (
      req.user.role === 'sales_manager' &&
      customer.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updates = { ...req.body };
    if (req.user.role === 'sales_manager') {
      delete updates.assignedTo;
    }

    const updated = await Customer.findByIdAndUpdate(
      req.params.id, updates, { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Sales managers may only delete customers assigned to them
    if (req.user.role === 'sales_manager') {
      const assignedTo = customer.assignedTo ? customer.assignedTo.toString() : null;
      if (assignedTo !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    // Delete customer and related interactions
    await Interaction.deleteMany({ customerId: customer._id });
    await Customer.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Customer and related interactions deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/customers/search - Global search
exports.searchCustomers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    let filter = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
      ],
    };

    // sales_manager only sees their assigned customers
    if (req.user.role === 'sales_manager') {
      filter.assignedTo = req.user._id;
    }

    const customers = await Customer.find(filter)
      .limit(parseInt(limit))
      .select('_id name email company churnScore')
      .sort({ name: 1 });

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
