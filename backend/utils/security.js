/**
 * Security Utilities
 */

const crypto = require('crypto');

/**
 * Timing-safe string comparison
 * Prevents timing attacks
 */
function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Parse positive integer from string
 */
function parsePositiveInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(parsed, max));
}

module.exports = {
  timingSafeEqual,
  parsePositiveInt
};
