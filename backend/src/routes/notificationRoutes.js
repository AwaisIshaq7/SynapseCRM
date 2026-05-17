const express = require('express')
const router = express.Router()
const { getNotifications, markNotificationsRead, sendAdminMessage } = require('../controllers/notificationController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/', getNotifications)
router.post('/mark-read', markNotificationsRead)
router.post('/admin-message', sendAdminMessage)

module.exports = router
