/**
 * Security Middleware Configuration
 * Centralizes all security configurations for the SecureSight backend
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { csrfProtection, parseCookies, csrfErrorHandler, attachCsrfToken } = require('./csrfMiddleware');

/**
 * Security Headers Configuration
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

/**
 * CORS Configuration
 */
const corsConfig = (allowedOrigins) => ({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token'],
  maxAge: 3600
});

/**
 * Rate Limiting Configurations
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Try again in a minute.'
  },
  skip: (req) => process.env.NODE_ENV === 'test'
});

const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.SCAN_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Scan rate limit exceeded. Slow down and retry.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Try again later.'
  }
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many registrations. Try again later.'
  }
});

module.exports = {
  helmetConfig,
  corsConfig,
  apiLimiter,
  scanLimiter,
  authLimiter,
  registrationLimiter,
  csrfProtection,
  parseCookies,
  csrfErrorHandler,
  attachCsrfToken
};
