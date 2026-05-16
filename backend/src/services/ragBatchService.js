const Customer = require('../models/Customer');

const generateDailyRiskReport = async () => {
  const customers = await Customer.find({ churnScore: { $gte: 0.7 } })
    .select('name company churnScore overallSentiment status assignedTo')
    .sort({ churnScore: -1 })
    .limit(25);

  return customers.map((customer) => ({
    customerId: customer._id,
    name: customer.name,
    company: customer.company,
    churnScore: customer.churnScore,
    overallSentiment: customer.overallSentiment,
    status: customer.status,
    assignedTo: customer.assignedTo,
  }));
};

const bulkSummarizeCustomers = async (customerIds) => {
  const customers = await Customer.find({ _id: { $in: customerIds } })
    .select('name company churnScore overallSentiment status');

  return customers.map((customer) => ({
    customerId: customer._id,
    customer: customer.name,
    summary: `${customer.name} (${customer.company || 'N/A'}) is ${customer.status} with ${(customer.churnScore * 100).toFixed(1)}% churn risk and ${customer.overallSentiment} sentiment.`,
  }));
};

module.exports = {
  generateDailyRiskReport,
  bulkSummarizeCustomers,
};
