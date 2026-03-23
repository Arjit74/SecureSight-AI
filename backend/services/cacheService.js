/**
 * Cache Service
 * Manages scan result caching
 */

const CACHE_TTL = Number(process.env.SCAN_CACHE_TTL_MS) || 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = Number(process.env.SCAN_CACHE_MAX_ENTRIES) || 1000;

const scanCache = new Map();

/**
 * Get item from cache
 * @param {string} key
 * @returns {object|null}
 */
function cacheGet(key) {
  const cached = scanCache.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    scanCache.delete(key);
    return null;
  }

  return cached;
}

/**
 * Set item in cache
 * @param {string} key
 * @param {object} data
 */
function cacheSet(key, data) {
  if (scanCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = scanCache.keys().next().value;
    if (oldestKey) {
      scanCache.delete(oldestKey);
    }
  }

  scanCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear cache
 */
function cacheClear() {
  scanCache.clear();
}

/**
 * Get cache stats
 */
function getCacheStats() {
  return {
    size: scanCache.size,
    maxSize: MAX_CACHE_ENTRIES,
    ttl: CACHE_TTL
  };
}

module.exports = {
  cacheGet,
  cacheSet,
  cacheClear,
  getCacheStats
};
