/**
 * Server-Sent Events (SSE) Manager
 * Manages real-time push connections to connected clients.
 */

// Map of userId -> Set of response objects (supports multiple tabs/devices)
const clients = new Map();

// Heartbeat interval reference
let heartbeatInterval = null;

/**
 * Add a client SSE connection
 */
function addClient(userId, res) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);

  // Start heartbeat if first client
  if (!heartbeatInterval) {
    startHeartbeat();
  }

  console.log(`📡 SSE client connected: ${userId} (${clients.get(userId).size} connections)`);
}

/**
 * Remove a client SSE connection
 */
function removeClient(userId, res) {
  const userClients = clients.get(userId);
  if (userClients) {
    userClients.delete(res);
    if (userClients.size === 0) {
      clients.delete(userId);
    }
  }

  // Stop heartbeat if no clients
  if (clients.size === 0 && heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  console.log(`📡 SSE client disconnected: ${userId}`);
}

/**
 * Send an SSE event to a specific user (all their connections)
 */
function sendToUser(userId, event, data) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) return false;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const res of userClients) {
    try {
      res.write(payload);
    } catch (err) {
      // Connection broken — clean up
      userClients.delete(res);
    }
  }

  return true;
}

/**
 * Send heartbeat to all connected clients every 30 seconds
 * Prevents proxy/load-balancer timeouts
 */
function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    const ping = `:heartbeat ${Date.now()}\n\n`;
    for (const [userId, userClients] of clients) {
      for (const res of userClients) {
        try {
          res.write(ping);
        } catch {
          userClients.delete(res);
        }
      }
      if (userClients.size === 0) clients.delete(userId);
    }
  }, 30000);
}

/**
 * Get count of connected clients
 */
function getClientCount() {
  let count = 0;
  for (const userClients of clients.values()) {
    count += userClients.size;
  }
  return count;
}

module.exports = { addClient, removeClient, sendToUser, getClientCount };
