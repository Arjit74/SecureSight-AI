/**
 * Winston Logger Configuration
 * Centralized logging system for the entire application
 * Logs to both console (development) and files (production)
 */

const winston = require('winston');
const path = require('path');

const ENV = process.env.NODE_ENV || 'development';
const LOG_DIR = process.env.LOG_DIR || './logs';

/**
 * Define log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Define colored console format for readability
 */
const coloredFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    
    // Format metadata
    if (Object.keys(meta).length > 0) {
      // Filter out Winston internal properties
      const filteredMeta = Object.keys(meta)
        .filter(key => !['timestamp', 'level', 'message', 'splat'].includes(key))
        .reduce((obj, key) => {
          obj[key] = meta[key];
          return obj;
        }, {});
      
      if (Object.keys(filteredMeta).length > 0) {
        metaStr = ' ' + JSON.stringify(filteredMeta);
      }
    }
    
    // Stack trace for errors
    if (meta.stack) {
      metaStr += '\n' + meta.stack;
    }
    
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

/**
 * Create transports array
 */
const transports = [];

/**
 * Console transport (always enabled, with colors)
 */
transports.push(
  new winston.transports.Console({
    format: coloredFormat,
    level: ENV === 'development' ? 'debug' : 'info'
  })
);

/**
 * File transport for all logs
 */
transports.push(
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'app.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    level: 'debug'
  })
);

/**
 * File transport for errors only
 */
transports.push(
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    level: 'error'
  })
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: ENV === 'development' ? 'debug' : 'info',
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'exceptions.log'),
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'rejections.log'),
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

/**
 * Helper functions for common logging patterns
 */

/**
 * Log HTTP request
 * @param {Express.Request} req - Express request object
 * @param {string} action - Action being performed
 */
function logRequest(req, action = 'Request') {
  logger.info(`${action}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
}

/**
 * Log HTTP response
 * @param {Express.Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 */
function logResponse(res, statusCode, message = 'Response') {
  logger.info(`${message}`, {
    statusCode,
    headers: res.getHeaders()
  });
}

/**
 * Log database operation
 * @param {string} operation - DB operation (SELECT, INSERT, UPDATE, DELETE)
 * @param {string} table - Database table name
 * @param {number} duration - Operation duration in ms
 * @param {object} meta - Additional metadata
 */
function logDatabase(operation, table, duration, meta = {}) {
  logger.debug(`Database ${operation}`, {
    table,
    durationMs: duration,
    ...meta
  });
}

/**
 * Log security event
 * @param {string} eventType - Type of security event
 * @param {string} description - Event description
 * @param {object} context - Event context
 */
function logSecurityEvent(eventType, description, context = {}) {
  logger.warn(`🔐 Security: ${eventType}`, {
    description,
    ...context
  });
}

/**
 * Log scan operation
 * @param {string} url - URL being scanned
 * @param {string} verdict - Scan verdict
 * @param {number} riskScore - Risk score
 * @param {object} meta - Additional metadata
 */
function logScan(url, verdict, riskScore, meta = {}) {
  const icon = verdict === 'BLOCK' ? '⛔' : verdict === 'WARN' ? '⚠️' : '✅';
  logger.info(`${icon} Scan Result: ${verdict}`, {
    url,
    riskScore,
    ...meta
  });
}

/**
 * Log file watcher event
 * @param {string} eventType - Event type (file-added, file-changed, scan-triggered)
 * @param {string} fileName - File name
 * @param {object} meta - Additional metadata
 */
function logFileWatcher(eventType, fileName, meta = {}) {
  const icons = {
    'file-added': '📥',
    'file-changed': '🔄',
    'scan-triggered': '🔍',
    'scan-complete': '✅',
    'duplicate-detected': '📋',
    'file-size-exceeded': '⚠️'
  };
  const icon = icons[eventType] || '📁';
  logger.info(`${icon} File Watcher: ${eventType}`, {
    fileName,
    ...meta
  });
}

/**
 * Log service initialization
 * @param {string} serviceName - Service name
 * @param {boolean} success - Initialization success
 * @param {object} meta - Additional metadata
 */
function logServiceInit(serviceName, success = true, meta = {}) {
  const level = success ? 'info' : 'error';
  const message = success ? `✅ Service initialized: ${serviceName}` : `❌ Service failed: ${serviceName}`;
  logger[level](message, meta);
}

/**
 * Log performance metric
 * @param {string} operationName - Operation name
 * @param {number} durationMs - Duration in milliseconds
 * @param {object} meta - Additional metadata
 */
function logPerformance(operationName, durationMs, meta = {}) {
  const level = durationMs > 1000 ? 'warn' : 'debug';
  logger[level](`Performance: ${operationName}`, {
    durationMs,
    ...meta
  });
}

/**
 * Parse error for logging
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @param {object} meta - Additional metadata
 */
function logError(error, context = 'Error', meta = {}) {
  logger.error(`❌ ${context}`, {
    message: error.message,
    stack: error.stack,
    code: error.code,
    ...meta
  });
}

/**
 * Create child logger with context
 * @param {object} meta - Default metadata for child logger
 * @returns {object} Child logger with log methods
 */
function createContextLogger(meta = {}) {
  return {
    debug: (msg, data) => logger.debug(msg, { ...meta, ...data }),
    info: (msg, data) => logger.info(msg, { ...meta, ...data }),
    warn: (msg, data) => logger.warn(msg, { ...meta, ...data }),
    error: (msg, data) => logger.error(msg, { ...meta, ...data })
  };
}

/**
 * Export logger
 */
module.exports = {
  logger,
  
  // Convenience methods
  debug: (msg, meta) => logger.debug(msg, meta),
  info: (msg, meta) => logger.info(msg, meta),
  warn: (msg, meta) => logger.warn(msg, meta),
  error: (msg, meta) => logger.error(msg, meta),
  
  // Specialized log functions
  logRequest,
  logResponse,
  logDatabase,
  logSecurityEvent,
  logScan,
  logFileWatcher,
  logServiceInit,
  logPerformance,
  logError,
  createContextLogger,
  
  // Winston instance export
  getLogger: () => logger
};
