const Notification = require('../models/Notification')

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({ success: true, data: notifications })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

exports.markNotificationsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body

    await Notification.updateMany(
      { _id: { $in: notificationIds }, userId: req.user._id },
      { read: true }
    )

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

exports.createChurnNotification = async (userId, customerName, churnScore) => {
  try {
    await Notification.create({
      userId,
      type: 'churn_alert',
      message: `${customerName} has high churn risk (${(churnScore * 100).toFixed(0)}%)`,
      data: { churnScore }
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}
