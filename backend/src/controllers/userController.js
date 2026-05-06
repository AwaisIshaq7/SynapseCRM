const User = require('../models/User');

// PUT /api/users/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { theme, widgetOrder } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: { theme, widgetOrder } },
      { new: true, runValidators: true }
    );

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