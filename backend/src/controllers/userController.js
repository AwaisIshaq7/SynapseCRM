const User = require('../models/User');
const Notification = require('../models/Notification');

// PUT /api/users/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { theme, widgetOrder } = req.body;

    const user = await User.findById(req.user._id);
    
    // Merge preferences instead of replacing
    if (theme !== undefined) user.preferences.theme = theme;
    if (widgetOrder !== undefined) user.preferences.widgetOrder = widgetOrder;
    
    await user.save({ validateBeforeSave: true });

    res.status(200).json({
      success: true,
      message: 'Preferences saved',
      data: user.preferences,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/users/usage-log
// Called by frontend every time a widget is clicked
exports.updateUsageLog = async (req, res) => {
  try {
    const { widgetName } = req.body;

    const user = await User.findById(req.user._id);

    // Increment click count for this widget
    const currentCount = user.usageLog.get(widgetName) || 0;
    user.usageLog.set(widgetName, currentCount + 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Usage log updated',
      data: Object.fromEntries(user.usageLog),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/users
// Admin only — get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendAdminMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });
    if (target.role !== 'sales_manager') {
      return res.status(400).json({ success: false, error: 'Messages can only be sent to sales managers' });
    }
    await Notification.create({
      userId: target._id,
      type: 'system',
      message: `Message from admin: ${message.trim()}`,
      data: { fromAdminId: req.user._id, fromAdminName: req.user.name },
    });
    res.status(201).json({ success: true, message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/users/:id
// Admin only — delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};