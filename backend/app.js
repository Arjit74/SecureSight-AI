/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Import configuration
const { pool, initDatabase } = require('./config/db');
const { getMLService } = require('./services/mlService');
const { initializeWatcher } = require('./services/fileWatcher');

// Import middleware
const { timingSafeEqual, parsePositiveInt } = require('./utils/security');

// Import logger
const { logger, logRequest, logServiceInit } = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Import heuristics manager
const heuristicsManager = require('./lib/heuristicsManager');

const app = express();

// Extract configuration
const API_KEY = process.env.API_KEY || '';
let dbReady = false;

/**
 * Parse allowed origins from environment variable
 */
function parseAllowedOrigins() {
  const configured = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ];
}

const allowedOrigins = parseAllowedOrigins();

/**
 * Check if origin is a browser extension
 */
function isExtensionOrigin(origin) {
  return origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://');
}

/**
 * Require API Key middleware
 */
function requireApiKey(req, res, next) {
  if (!API_KEY) {
    return next();
  }

  const incoming = req.get('x-api-key');
  if (!incoming || !timingSafeEqual(incoming, API_KEY)) {
    return res.status(401).json({ error: 'Unauthorized: invalid API key' });
  }

  return next();
}

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.disable('x-powered-by');

// Request ID tracking
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    requestId: req.requestId
  });
  
  // Log response when it's sent
  const originalSend = res.send;
  res.send = function (data) {
    logger.debug('Response sent', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      requestId: req.requestId
    });
    return originalSend.call(this, data);
  };
  
  next();
});

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isExtensionOrigin(origin) || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token']
  })
);

// Body parser
app.use(express.json({ limit: process.env.REQUEST_SIZE_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_SIZE_LIMIT || '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Try again in a minute.'
  }
});

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.SCAN_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Scan rate limit exceeded. Slow down and retry.'
  }
});

app.use('/api', apiLimiter);
app.use('/api/scan', scanLimiter);

// ============================================
// ROUTES
// ============================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Scan routes (with API key requirement)
app.use('/api/scan', requireApiKey, scanRoutes);

// Report routes (public read, protected write)
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const mlInfo = await getMLService().getModelInfo();
    res.json({
      status: dbReady ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      ml: mlInfo,
      database: dbReady ? 'connected' : 'unavailable',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security status
app.get('/api/security/status', (req, res) => {
  res.json({
    api_key_required: Boolean(API_KEY),
    cors_allowed_origins_count: allowedOrigins.length,
    security_headers: 'helmet',
    rate_limiting: {
      general_per_minute: Number(process.env.RATE_LIMIT_MAX) || 120,
      scans_per_minute: Number(process.env.SCAN_RATE_LIMIT_MAX) || 30
    }
  });
});

// Scan history routes (with API key requirement)
app.get('/api/scans', requireApiKey, async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 50, 1, 200);
    const offset = parsePositiveInt(req.query.offset, 0, 0, 100000);

    const result = await pool.query(
      'SELECT id, url, verdict, confidence, model_used, analysis_time_ms, created_at FROM scans ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return res.json({
      total: result.rows.length,
      limit,
      offset,
      scans: result.rows
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/scans/:scanId', requireApiKey, async (req, res) => {
  try {
    const { scanId } = req.params;

    const result = await pool.query('SELECT * FROM scans WHERE id = $1', [scanId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((error, req, res, next) => {
  if (error && error.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: origin not allowed' });
  }

  return next(error);
});

app.use((error, req, res, next) => {
  logger.error('Unhandled API error', {
    message: error.message,
    stack: error.stack,
    requestId: req.requestId,
    path: req.path,
    method: req.method
  });
  
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error: 'Internal server error',
    request_id: req.requestId
  });
});

// ============================================
// BOOTSTRAP & EXPORT
// ============================================

/**
 * Initialize application
 */
async function bootstrap() {
  try {
    heuristicsManager.load();
    logServiceInit('Heuristics Manager', true);
    
    dbReady = await initDatabase();
    logServiceInit('Database', dbReady, { initialized: dbReady });

    const mlInitialized = await getMLService().initialize();
    logServiceInit('ML Service', mlInitialized, { 
      model: mlInitialized ? 'loaded' : 'fallback mode'
    });

    // Initialize real-time file watcher
    await initializeWatcher();
  } catch (error) {
    logger.error('Bootstrap failed', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  app,
  bootstrap
};
