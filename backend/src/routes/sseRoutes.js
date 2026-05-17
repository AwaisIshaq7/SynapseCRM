const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { addClient, removeClient, getClientCount } = require('../services/sseManager');

/**
 * GET /api/sse/notifications
 * Establishes an SSE connection for real-time notification delivery.
 */
router.get('/notifications', protect, (req, res) => {
  const userId = req.user._id.toString();

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  });

  // Send initial connection confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ userId, timestamp: Date.now() })}\n\n`);

  // Register this connection
  addClient(userId, res);

  // Clean up on disconnect
  req.on('close', () => {
    removeClient(userId, res);
  });
});

/**
 * GET /api/sse/status
 * Returns SSE connection stats (admin debugging)
 */
router.get('/status', protect, (req, res) => {
  res.json({
    success: true,
    data: { connectedClients: getClientCount() },
  });
});

module.exports = router;
