/**
 * URL Utilities
 */

/**
 * Validate and normalize URL
 */
function validateAndNormalizeUrl(input) {
  if (typeof input !== 'string') {
    throw new Error('URL must be a string');
  }

  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('URL is required');
  }

  if (trimmed.length > 2048) {
    throw new Error('URL length exceeds 2048 characters');
  }

  const candidate = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
  let parsed;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP/HTTPS URLs are supported');
  }

  if (!parsed.hostname) {
    throw new Error('URL hostname is required');
  }

  return parsed.toString();
}

module.exports = {
  validateAndNormalizeUrl
};
