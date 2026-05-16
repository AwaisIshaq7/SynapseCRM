/**
 * Performance Monitoring Middleware
 * Tracks and logs API endpoint performance metrics
 */

const fs = require('fs');
const path = require('path');

// Performance metrics storage
const metrics = {
  endpoints: {},
  startTime: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
};

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'api-performance.log');

/**
 * Log performance data to file
 */
function logPerformance(data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

/**
 * Performance monitoring middleware
 */
function performanceMonitor() {
  return (req, res, next) => {
    const startTime = Date.now();
    const startHrTime = process.hrtime();
    
    // Flag to prevent double processing
    let alreadyLogged = false;
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to capture when response is sent
    res.end = function(...args) {
      // Prevent double logging if end is called multiple times
      if (alreadyLogged) {
        return originalEnd.apply(res, args);
      }
      alreadyLogged = true;
      
      // Calculate performance metrics
      const endHrTime = process.hrtime(startHrTime);
      const durationMs = (endHrTime[0] * 1000) + (endHrTime[1] / 1000000);
      const statusCode = res.statusCode;
      
      const method = req.method;
      const path = req.path;
      const endpoint = `${method} ${path}`;
      
      // Update metrics
      metrics.totalRequests++;
      if (statusCode >= 400) metrics.totalErrors++;
      
      if (!metrics.endpoints[endpoint]) {
        metrics.endpoints[endpoint] = {
          method,
          path,
          count: 0,
          totalTime: 0,
          avgTime: 0,
          minTime: Infinity,
          maxTime: 0,
          errors: 0,
          statusCodes: {},
        };
      }
      
      const endpointMetrics = metrics.endpoints[endpoint];
      endpointMetrics.count++;
      endpointMetrics.totalTime += durationMs;
      endpointMetrics.avgTime = endpointMetrics.totalTime / endpointMetrics.count;
      endpointMetrics.minTime = Math.min(endpointMetrics.minTime, durationMs);
      endpointMetrics.maxTime = Math.max(endpointMetrics.maxTime, durationMs);
      
      if (statusCode >= 400) endpointMetrics.errors++;
      
      endpointMetrics.statusCodes[statusCode] = (endpointMetrics.statusCodes[statusCode] || 0) + 1;
      
      // Log to console (colorized)
      logRequestPerformance(method, path, statusCode, durationMs);
      
      // Log to file
      logPerformance({
        method,
        path,
        statusCode,
        durationMs: parseFloat(durationMs.toFixed(2)),
        timestamp: new Date().toISOString(),
        userId: req.user?.id || 'anonymous',
        query: req.query,
      });
      
      // Alert on slow requests
      if (durationMs > 1000) {
        console.warn(`⚠️  SLOW REQUEST: ${method} ${path} took ${durationMs.toFixed(0)}ms`);
      }
      
      // Call original end
      return originalEnd.apply(res, args);
    };
    
    next();
  };
}

/**
 * Log request performance with color coding
 */
function logRequestPerformance(method, path, statusCode, durationMs) {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  };
  
  let statusColor = colors.green;
  if (statusCode >= 500) statusColor = colors.red;
  else if (statusCode >= 400) statusColor = colors.yellow;
  else if (statusCode >= 300) statusColor = colors.cyan;
  
  let speedColor = colors.green;
  if (durationMs > 1000) speedColor = colors.red;
  else if (durationMs > 500) speedColor = colors.yellow;
  
  const methodPadded = method.padEnd(6);
  const pathPadded = path.substring(0, 40).padEnd(40);
  const durationPadded = durationMs.toFixed(2).padStart(8);
  
  console.log(
    `${colors.blue}[${new Date().toLocaleTimeString()}]${colors.reset} ` +
    `${methodPadded} ${pathPadded} ` +
    `${statusColor}${statusCode}${colors.reset} ` +
    `${speedColor}${durationPadded}ms${colors.reset}`
  );
}

/**
 * Get performance report
 */
function getPerformanceReport() {
  const uptime = Date.now() - metrics.startTime;
  
  // Calculate summary statistics
  const endpointStats = Object.values(metrics.endpoints).map(e => ({
    ...e,
    minTime: e.minTime === Infinity ? 0 : e.minTime,
  }));
  
  const avgResponseTime = endpointStats.length > 0
    ? endpointStats.reduce((sum, e) => sum + e.avgTime, 0) / endpointStats.length
    : 0;
  
  const slowestEndpoints = endpointStats
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);
  
  const errorRate = metrics.totalRequests > 0
    ? ((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(2)
    : 0;
  
  return {
    uptime: `${(uptime / 1000).toFixed(0)}s`,
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    errorRate: `${errorRate}%`,
    avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
    slowestEndpoints: slowestEndpoints.map(e => ({
      endpoint: `${e.method} ${e.path}`,
      avgTime: `${e.avgTime.toFixed(2)}ms`,
      minTime: `${e.minTime.toFixed(2)}ms`,
      maxTime: `${e.maxTime.toFixed(2)}ms`,
      requestCount: e.count,
      errorCount: e.errors,
    })),
    allEndpoints: Object.values(metrics.endpoints)
      .map(e => ({
        endpoint: `${e.method} ${e.path}`,
        count: e.count,
        avgTime: `${e.avgTime.toFixed(2)}ms`,
        statusCodes: e.statusCodes,
      }))
      .sort((a, b) => parseInt(b.count) - parseInt(a.count)),
  };
}

/**
 * Reset metrics
 */
function resetMetrics() {
  metrics.endpoints = {};
  metrics.totalRequests = 0;
  metrics.totalErrors = 0;
  metrics.startTime = Date.now();
}

module.exports = {
  performanceMonitor,
  getPerformanceReport,
  resetMetrics,
  logFile,
};
