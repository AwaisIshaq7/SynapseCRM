const express = require('express')
const router = express.Router()
const { getNotifications, markNotificationsRead } = require('../controllers/notificationController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/', getNotifications)
router.post('/mark-read', markNotificationsRead)

module.exports = router
