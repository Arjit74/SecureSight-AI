/**
 * Scan Controller
 * Handles URL scanning endpoints
 */

const { scanUrl } = require('../services/scanService');
const { validateAndNormalizeUrl } = require('../utils/urlValidator');
const { pool } = require('../config/db');
const { parsePositiveInt } = require('../utils/security');
const { getMLService } = require('../services/mlService');

/**
 * POST /api/scan/url
 * Scan a single URL with optional file metadata
 */
exports.scanUrl = async (req, res) => {
  try {
    let normalizedUrl;
    try {
      normalizedUrl = validateAndNormalizeUrl(req.body?.url);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const result = await scanUrl(normalizedUrl);
    
    // Add optional file metadata if provided
    if (req.body?.file_name) {
      result.file_name = req.body.file_name;
    }
    
    if (req.body?.file_hash) {
      result.file_hash = req.body.file_hash;
    }
    
    if (req.body?.malware_type) {
      result.malware_type = req.body.malware_type;
    }
    
    return res.json(result);
  } catch (error) {
    console.error('URL scan error:', error.message);
    return res.status(500).json({
      error: 'Scan failed',
      message: error.message,
      fallback_verdict: 'WARN',
      confidence: 0.5
    });
  }
};

/**
 * POST /api/scan/bulk
 * Scan multiple URLs
 */
exports.scanBulk = async (req, res) => {
  const urls = req.body?.urls;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls must be a non-empty array' });
  }

  if (urls.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 URLs per request' });
  }

  try {
    const results = [];

    for (const inputUrl of urls) {
      try {
        const normalizedUrl = validateAndNormalizeUrl(inputUrl);
        const result = await scanUrl(normalizedUrl);
        results.push({
          url: normalizedUrl,
          is_malicious: result.verdict === 'BLOCK',
          confidence: result.confidence,
          risk_level: result.risk_score >= 75 ? 'HIGH' : result.risk_score >= 45 ? 'MEDIUM' : 'LOW'
        });
      } catch (error) {
        results.push({
          url: String(inputUrl || ''),
          error: error.message,
          status: 'failed'
        });
      }
    }

    const maliciousCount = results.filter((result) => result.is_malicious).length;
    const confidenceSamples = results
      .filter((result) => typeof result.confidence === 'number')
      .map((result) => result.confidence);

    const avgConfidence = confidenceSamples.length
      ? Number((confidenceSamples.reduce((sum, value) => sum + value, 0) / confidenceSamples.length).toFixed(4))
      : 0;

    return res.json({
      total_scanned: urls.length,
      malicious_count: maliciousCount,
      safe_count: urls.length - maliciousCount,
      avg_confidence: avgConfidence,
      results
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/debug/features
 * Get features for a URL (debug endpoint)
 */
exports.debugFeatures = async (req, res) => {
  const URLFeatureExtractor = require('../lib/featureExtractor');

  let normalizedUrl;
  try {
    normalizedUrl = validateAndNormalizeUrl(req.body?.url);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const features = URLFeatureExtractor.extractFeatures(normalizedUrl);
    return res.json({
      url: normalizedUrl,
      feature_count: Object.keys(features).length,
      features,
      sample_features: {
        url_length: features.url_length,
        digit_ratio: features.digit_ratio,
        entropy: features.url_entropy,
        suspicious_tld: features.is_suspicious_tld,
        has_ip: features.has_ip_address
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/scans
 * Get scan history
 */
exports.getScanHistory = async (req, res) => {
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
};

/**
 * GET /api/scans/:scanId
 * Get specific scan
 */
exports.getScanById = async (req, res) => {
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
};

/**
 * GET /api/model/info
 * Get model information
 */
exports.getModelInfo = async (req, res) => {
  try {
    const mlService = getMLService();
    const info = await mlService.getModelInfo();
    const performance = await pool.query('SELECT * FROM model_performance ORDER BY timestamp DESC LIMIT 5');

    return res.json({
      models: info,
      performance: performance.rows,
      feature_extractors: {
        url: '65+ features',
        file: 'coming_soon'
      },
      training_data: {
        url: 'phishing + benign URLs',
        file: 'EMBER dataset recommended'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
