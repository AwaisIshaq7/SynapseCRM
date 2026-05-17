const Notification = require('../models/Notification')
const sseManager = require('../services/sseManager')

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
    const notification = await Notification.create({
      userId,
      type: 'churn_alert',
      message: `${customerName} has high churn risk (${(churnScore * 100).toFixed(0)}%)`,
      data: { churnScore }
    })
    
    // Push via SSE
    sseManager.sendToUser(userId.toString(), 'notification', notification);
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}

exports.createSentimentNotification = async (userId, customerName) => {
  try {
    const notification = await Notification.create({
      userId,
      type: 'sentiment_alert',
      message: `${customerName} has three consecutive negative interactions`,
      data: { customerName }
    })
    
    // Push via SSE
    sseManager.sendToUser(userId.toString(), 'notification', notification);
  } catch (error) {
    console.error('Failed to create sentiment notification:', error)
  }
}

exports.sendAdminMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can send direct messages' })
    }

    if (!receiverId || !message) {
      return res.status(400).json({ success: false, error: 'Receiver ID and message are required' })
    }

    const notification = await Notification.create({
      userId: receiverId,
      type: 'admin_message',
      message,
      data: { senderName: req.user.name, senderId: req.user._id }
    })
    
    // Push via SSE immediately
    sseManager.sendToUser(receiverId.toString(), 'notification', notification)

    res.json({ success: true, data: notification })
  } catch (error) {
    console.error('Failed to send admin message:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
