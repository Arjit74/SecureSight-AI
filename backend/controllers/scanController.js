/**
 * Scan Controller
 * Handles URL scanning endpoints
 */

const { scanUrl } = require('../services/scanService');
const { validateAndNormalizeUrl } = require('../utils/urlValidator');
const { pool } = require('../config/db');
const { parsePositiveInt } = require('../utils/security');
const { getMLService } = require('../services/mlService');
const {
  summarizeScans,
  buildTimelineRows,
  compareScans
} = require('../lib/scanAnalytics');

function extractDomain(inputUrl) {
  try {
    return new URL(inputUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

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

/**
 * GET /api/scan/analytics
 * Returns summary and timeline analytics for recent scans
 */
exports.getScanAnalytics = async (req, res) => {
  try {
    const sinceHours = parsePositiveInt(req.query.sinceHours, 24, 1, 24 * 30);
    const bucket = sinceHours <= 72 ? 'hour' : 'day';

    const summaryResult = await pool.query(
      `SELECT verdict, confidence, risk_score, analysis_time_ms
       FROM scans
       WHERE created_at >= NOW() - ($1::text || ' hours')::interval`,
      [String(sinceHours)]
    );

    const timelineResult = await pool.query(
      `SELECT
          date_trunc($1, created_at) AS bucket,
          COUNT(*)::int AS total_scans,
          COUNT(*) FILTER (WHERE verdict = 'ALLOW')::int AS allow_count,
          COUNT(*) FILTER (WHERE verdict = 'WARN')::int AS warn_count,
          COUNT(*) FILTER (WHERE verdict = 'BLOCK')::int AS block_count,
          AVG(COALESCE(risk_score, 0))::float AS avg_risk_score,
          AVG(COALESCE(confidence, 0))::float AS avg_confidence
       FROM scans
       WHERE created_at >= NOW() - ($2::text || ' hours')::interval
       GROUP BY 1
       ORDER BY 1 ASC`,
      [bucket, String(sinceHours)]
    );

    return res.json({
      window: {
        since_hours: sinceHours,
        bucket
      },
      summary: summarizeScans(summaryResult.rows),
      timeline: buildTimelineRows(timelineResult.rows)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/scan/history/search
 * Search and filter scan history with verdict/date/domain criteria
 */
exports.searchScanHistory = async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 25, 1, 200);
    const offset = parsePositiveInt(req.query.offset, 0, 0, 100000);
    const verdict = typeof req.query.verdict === 'string' ? req.query.verdict.toUpperCase() : null;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const from = typeof req.query.from === 'string' ? req.query.from : null;
    const to = typeof req.query.to === 'string' ? req.query.to : null;

    const where = [];
    const values = [];

    if (verdict && ['ALLOW', 'WARN', 'BLOCK'].includes(verdict)) {
      values.push(verdict);
      where.push(`verdict = $${values.length}`);
    }

    if (q) {
      values.push(`%${q}%`);
      where.push(`url ILIKE $${values.length}`);
    }

    if (from) {
      values.push(from);
      where.push(`created_at >= $${values.length}::timestamp`);
    }

    if (to) {
      values.push(to);
      where.push(`created_at <= $${values.length}::timestamp`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    values.push(limit);
    const limitPlaceholder = `$${values.length}`;
    values.push(offset);
    const offsetPlaceholder = `$${values.length}`;

    const query = `
      SELECT id, url, verdict, confidence, risk_score, model_used, analysis_time_ms, created_at
      FROM scans
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitPlaceholder}
      OFFSET ${offsetPlaceholder}
    `;

    const countValues = values.slice(0, values.length - 2);
    const countQuery = `SELECT COUNT(*)::int AS total FROM scans ${whereClause}`;

    const [result, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues)
    ]);

    return res.json({
      filters: {
        verdict,
        q,
        from,
        to
      },
      total: countResult.rows[0]?.total || 0,
      limit,
      offset,
      scans: result.rows
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/scan/domains/insights
 * Returns top domains with security posture metrics
 */
exports.getDomainInsights = async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 15, 1, 100);
    const minScans = parsePositiveInt(req.query.minScans, 2, 1, 500);
    const sinceDays = parsePositiveInt(req.query.sinceDays, 30, 1, 365);

    const result = await pool.query(
      `SELECT url, verdict, risk_score, confidence
       FROM scans
       WHERE created_at >= NOW() - ($1::text || ' days')::interval`,
      [String(sinceDays)]
    );

    const statsByDomain = new Map();

    for (const row of result.rows) {
      const domain = extractDomain(row.url);
      if (!domain) {
        continue;
      }

      if (!statsByDomain.has(domain)) {
        statsByDomain.set(domain, {
          domain,
          scan_count: 0,
          block_count: 0,
          warn_count: 0,
          allow_count: 0,
          risk_sum: 0,
          confidence_sum: 0
        });
      }

      const item = statsByDomain.get(domain);
      item.scan_count += 1;
      item.risk_sum += Number(row.risk_score || 0);
      item.confidence_sum += Number(row.confidence || 0);

      if (row.verdict === 'BLOCK') item.block_count += 1;
      else if (row.verdict === 'WARN') item.warn_count += 1;
      else if (row.verdict === 'ALLOW') item.allow_count += 1;
    }

    const insights = Array.from(statsByDomain.values())
      .filter((item) => item.scan_count >= minScans)
      .map((item) => ({
        domain: item.domain,
        scan_count: item.scan_count,
        block_count: item.block_count,
        warn_count: item.warn_count,
        allow_count: item.allow_count,
        block_rate: Number(((item.block_count / item.scan_count) * 100).toFixed(2)),
        avg_risk_score: Number((item.risk_sum / item.scan_count).toFixed(2)),
        avg_confidence: Number((item.confidence_sum / item.scan_count).toFixed(4))
      }))
      .sort((a, b) => b.avg_risk_score - a.avg_risk_score || b.scan_count - a.scan_count)
      .slice(0, limit);

    return res.json({
      window_days: sinceDays,
      min_scans: minScans,
      total_domains: insights.length,
      domains: insights
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/scan/rescan/:scanId
 * Re-run scan for URL from existing scan record
 */
exports.rescanById = async (req, res) => {
  try {
    const { scanId } = req.params;
    const existing = await pool.query(
      'SELECT id, url, verdict, confidence, risk_score FROM scans WHERE id = $1',
      [scanId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const original = existing.rows[0];
    const normalizedUrl = validateAndNormalizeUrl(original.url);
    const latest = await scanUrl(normalizedUrl);

    return res.json({
      status: 'rescanned',
      source_scan_id: original.id,
      comparison: compareScans(
        {
          scan_id: original.id,
          verdict: original.verdict,
          confidence: Number(original.confidence || 0),
          risk_score: Number(original.risk_score || 0)
        },
        {
          scan_id: latest.scan_id,
          verdict: latest.verdict,
          confidence: latest.confidence,
          risk_score: latest.risk_score
        }
      ),
      latest_scan: latest
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
