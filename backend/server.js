/**
 * SecureSight AI Backend Server Entry Point
 * Starts the Express application
 */

require('dotenv').config();

const { app, bootstrap } = require('./app');
const { closeDatabase } = require('./config/db');
const { stopWatcher } = require('./services/fileWatcher');
const { logger, logServiceInit } = require('./utils/logger');

const PORT = Number(process.env.PORT) || 3000;
<<<<<<< HEAD
=======
const CACHE_TTL = Number(process.env.SCAN_CACHE_TTL_MS) || 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = Number(process.env.SCAN_CACHE_MAX_ENTRIES) || 1000;
const API_KEY = process.env.API_KEY || '';

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'securesight'
    };

const pool = new Pool(poolConfig);
const scanCache = new Map();
let mlServiceInstance = null;

let dbReady = false;

function buildFallbackMLService() {
  return {
    async initialize() {
      return false;
    },
    async predictUrl() {
      return {
        is_malicious: false,
        confidence: 0.5,
        probabilities: {
          benign: 0.5,
          malicious: 0.5
        },
        top_features: {},
        model_used: 'unavailable_fallback'
      };
    },
    async getModelInfo() {
      return {
        url_model: {
          loaded: false,
          type: 'unavailable_fallback',
          features: 'unknown',
          status: 'unavailable'
        },
        file_model: {
          loaded: false,
          type: 'not_implemented',
          status: 'pending'
        },
        initialized: false
      };
    }
  };
}

function getMLService() {
  if (mlServiceInstance) {
    return mlServiceInstance;
  }

  const candidates = [
    path.resolve(__dirname, '../node-ml-bridge/ml_service.js'),
    path.resolve(__dirname, '..', 'node-ml-bridge', 'ml_service.js')
  ];

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      mlServiceInstance = require(candidate);
      return mlServiceInstance;
    } catch (error) {
      // Continue to the next candidate path.
    }
  }

  mlServiceInstance = buildFallbackMLService();
  console.warn('ML service module unavailable, using safe fallback predictions');
  return mlServiceInstance;
}

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

function isExtensionOrigin(origin) {
  return origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://');
}

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

function parsePositiveInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(parsed, max));
}

function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuf, bBuf);
}

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

function combineScores(mlResult, heuristicResult) {
  const mlWeight = 0.75;
  const heuristicWeight = 0.25;

  const confidence = typeof mlResult?.confidence === 'number' ? mlResult.confidence : 0.5;
  const mlRisk = mlResult?.is_malicious ? confidence * 100 : (1 - confidence) * 100;

  let heuristicRisk = 50;
  if (typeof heuristicResult?.totalSuspicion === 'number') {
    heuristicRisk = Math.max(0, Math.min(100, heuristicResult.totalSuspicion * 3.3));
  } else if (
    typeof heuristicResult?.score === 'number' &&
    typeof heuristicResult?.maxScore === 'number' &&
    heuristicResult.maxScore > 0
  ) {
    const ratio = heuristicResult.score / heuristicResult.maxScore;
    heuristicRisk = Math.max(0, Math.min(100, 100 - ratio * 100));
  }

  return Number((mlRisk * mlWeight + heuristicRisk * heuristicWeight).toFixed(2));
}

function determineVerdict(riskScore, confidence) {
  if (riskScore >= 75 && confidence >= 0.75) return 'BLOCK';
  if (riskScore >= 45 && confidence >= 0.55) return 'WARN';
  if (riskScore <= 25 && confidence <= 0.6) return 'ALLOW';
  return 'WARN';
}

function generateRecommendations(verdict, mlResult) {
  const recommendations = [];

  if (verdict === 'BLOCK') {
    recommendations.push('Do not visit this URL');
    recommendations.push('Report this URL to your security team');

    if (mlResult.top_features && Object.keys(mlResult.top_features).length > 0) {
      const topFeature = Object.keys(mlResult.top_features)[0];
      recommendations.push(`Top risk factor: ${topFeature}`);
    }

    return recommendations;
  }

  if (verdict === 'WARN') {
    recommendations.push('Proceed only if you trust the source');
    recommendations.push('Verify the domain and certificate before entering credentials');
    return recommendations;
  }

  recommendations.push('URL appears low risk based on current signals');
  recommendations.push('Continue following standard browsing precautions');
  return recommendations;
}

function toConfidencePercent(confidence) {
  const numeric = typeof confidence === 'number' ? confidence : 0;
  return Number((Math.max(0, Math.min(1, numeric)) * 100).toFixed(2));
}

function toSafetyScore(riskScore) {
  const numeric = typeof riskScore === 'number' ? riskScore : 50;
  return Number((100 - Math.max(0, Math.min(100, numeric))).toFixed(2));
}

function mapRiskLevel(riskScore) {
  if (riskScore >= 90) return 'CRITICAL';
  if (riskScore >= 70) return 'HIGH';
  if (riskScore >= 50) return 'MEDIUM';
  if (riskScore >= 30) return 'LOW-MEDIUM';
  return 'LOW';
}

function deriveRiskScoreFromVerdict(verdict) {
  if (verdict === 'BLOCK') return 90;
  if (verdict === 'WARN') return 55;
  if (verdict === 'ALLOW') return 10;
  return 50;
}

function buildScanPhases(heuristicResult, mlResult, verdict, confidencePercent) {
  const heuristicScore = typeof heuristicResult?.totalSuspicion === 'number'
    ? Number(heuristicResult.totalSuspicion.toFixed(2))
    : 0;
  const heuristicMax = 30;
  const heuristicStatus = heuristicScore >= 18 ? 'danger' : heuristicScore >= 8 ? 'warning' : 'safe';

  const mlStatus = mlResult?.is_malicious ? 'danger' : confidencePercent < 55 ? 'warning' : 'safe';

  return {
    heuristics: {
      name: 'Heuristic Rules',
      status: heuristicStatus,
      score: heuristicScore,
      maxScore: heuristicMax,
      findings: heuristicResult?.signals || []
    },
    ml: {
      name: 'ML Inference',
      status: mlStatus,
      score: confidencePercent,
      maxScore: 100,
      details: mlResult?.is_malicious ? 'Model indicates malicious behavior' : 'Model indicates benign behavior'
    },
    final: {
      name: 'Final Verdict',
      status: verdict === 'BLOCK' ? 'danger' : verdict === 'WARN' ? 'warning' : 'safe',
      details: `Final action: ${verdict}`
    }
  };
}

function buildUnifiedScanResult(rawResult) {
  const riskScore = typeof rawResult.risk_score === 'number' ? rawResult.risk_score : 50;
  const confidence = typeof rawResult.confidence === 'number' ? rawResult.confidence : 0.5;
  const safetyScore = toSafetyScore(riskScore);
  const confidencePercent = toConfidencePercent(confidence);
  const verdict = rawResult.verdict || 'WARN';
  const phases = buildScanPhases(rawResult.detailed_analysis?.heuristics, rawResult.detailed_analysis?.ml_prediction, verdict, confidencePercent);

  return {
    status: 'completed',
    schema_version: '2.2.0',
    scan_id: rawResult.scan_id,
    scanId: rawResult.scan_id,
    url: rawResult.url,
    verdict,
    score: safetyScore,
    risk_score: Number(riskScore.toFixed(2)),
    riskScore: Number(riskScore.toFixed(2)),
    riskLevel: mapRiskLevel(riskScore),
    confidence,
    confidence_percent: confidencePercent,
    model_used: rawResult.model_used || 'unknown',
    analysis_time_ms: rawResult.analysis_time_ms,
    recommendations: rawResult.recommendations || [],
    reasoning: (rawResult.recommendations || [])[0] || 'Security analysis completed',
    phases,
    detailed_analysis: rawResult.detailed_analysis || {}
  };
}

function buildApiError(req, code, message, details) {
  return {
    error: message,
    code,
    details,
    request_id: req.requestId,
    timestamp: new Date().toISOString()
  };
}

function buildRawResultFromDbRow(row) {
  const features = row.features || {};
  const riskScore = Number(
    typeof features.risk_score === 'number' ? features.risk_score : deriveRiskScoreFromVerdict(row.verdict)
  );

  return {
    scan_id: row.id,
    url: row.url,
    verdict: row.verdict,
    confidence: Number(row.confidence || 0.5),
    risk_score: Number.isFinite(riskScore) ? riskScore : 50,
    model_used: row.model_used,
    analysis_time_ms: row.analysis_time_ms,
    recommendations: Array.isArray(features.recommendations) ? features.recommendations : [],
    detailed_analysis: features
  };
}

async function runUrlScan(normalizedUrl) {
  const startTime = Date.now();
  const featureStart = Date.now();
  const features = URLFeatureExtractor.extractFeatures(normalizedUrl);
  const featureTime = Date.now() - featureStart;

  const mlStart = Date.now();
  const mlResult = await getMLService().predictUrl(features);
  const mlTime = Date.now() - mlStart;

  const heuristicResult = heuristicsManager.evaluate(normalizedUrl, {});
  const riskScore = combineScores(mlResult, heuristicResult);
  const confidence = typeof mlResult.confidence === 'number' ? mlResult.confidence : 0.5;
  const verdict = determineVerdict(riskScore, confidence);

  return {
    scan_id: crypto.randomUUID(),
    url: normalizedUrl,
    verdict,
    confidence,
    risk_score: riskScore,
    model_used: mlResult.model_used,
    analysis_time_ms: Date.now() - startTime,
    features_analyzed: Object.keys(features).length,
    detailed_analysis: {
      ml_prediction: {
        is_malicious: mlResult.is_malicious,
        confidence,
        top_features: mlResult.top_features,
        probabilities: mlResult.probabilities
      },
      heuristics: heuristicResult,
      feature_extraction_time: featureTime,
      ml_inference_time: mlTime
    },
    recommendations: generateRecommendations(verdict, mlResult)
  };
}

async function storeScanInDatabase(scanData) {
  if (!dbReady) {
    return;
  }

  try {
    await pool.query(
      `INSERT INTO scans (id, url, verdict, confidence, features, model_used, analysis_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        scanData.scan_id,
        scanData.url,
        scanData.verdict,
        scanData.confidence,
        JSON.stringify(scanData.detailed_analysis),
        scanData.model_used,
        scanData.analysis_time_ms
      ]
    );
  } catch (error) {
    console.error('Failed to store scan in database:', error.message);
  }
}

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        verdict TEXT NOT NULL,
        confidence DECIMAL(4,3),
        features JSONB,
        model_used TEXT,
        analysis_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS model_performance (
        id SERIAL PRIMARY KEY,
        model_type TEXT NOT NULL,
        accuracy DECIMAL(5,4),
        false_positives INTEGER,
        false_negatives INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    dbReady = true;
    console.log('Database tables initialized');
  } catch (error) {
    dbReady = false;
    console.error('Database initialization error:', error.message);
  }
}

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

app.disable('x-powered-by');

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  })
);

app.use(express.json({ limit: process.env.REQUEST_SIZE_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_SIZE_LIMIT || '1mb' }));

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

app.use('/api/scan', requireApiKey);
app.use('/api/scans', requireApiKey);
app.use('/api/model', requireApiKey);
app.use('/api/debug', requireApiKey);

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

app.post('/api/scan/url', async (req, res) => {
  if (!req.is('application/json')) {
    return res.status(415).json(buildApiError(req, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json'));
  }

  let normalizedUrl;
  try {
    normalizedUrl = validateAndNormalizeUrl(req.body?.url);
  } catch (error) {
    return res.status(400).json(buildApiError(req, 'INVALID_URL', error.message));
  }

  const cacheKey = `url:${normalizedUrl}`;
  const cached = cacheGet(cacheKey);

  if (cached) {
    return res.json({
      ...buildUnifiedScanResult(cached.data),
      cached: true,
      cache_age_ms: Date.now() - cached.timestamp
    });
  }

  try {
    const result = await runUrlScan(normalizedUrl);

    cacheSet(cacheKey, result);
    await storeScanInDatabase(result);

    return res.json(buildUnifiedScanResult(result));
  } catch (error) {
    console.error('URL scan error:', error.message);
    return res.status(500).json(buildApiError(req, 'SCAN_FAILED', 'Scan failed', {
      message: error.message,
      fallback_verdict: 'WARN',
      confidence: 0.5
    }));
  }
});

// Extension compatibility route.
app.post('/api/scan', async (req, res) => {
  if (!req.is('application/json')) {
    return res.status(415).json(buildApiError(req, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json'));
  }

  let normalizedUrl;
  try {
    normalizedUrl = validateAndNormalizeUrl(req.body?.url);
  } catch (error) {
    return res.status(400).json(buildApiError(req, 'INVALID_URL', error.message));
  }

  const cacheKey = `url:${normalizedUrl}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return res.json({
      ...buildUnifiedScanResult(cached.data),
      cached: true,
      cache_age_ms: Date.now() - cached.timestamp
    });
  }

  try {
    const result = await runUrlScan(normalizedUrl);
    cacheSet(cacheKey, result);
    await storeScanInDatabase(result);
    return res.json(buildUnifiedScanResult(result));
  } catch (error) {
    return res.status(500).json(buildApiError(req, 'SCAN_FAILED', 'Scan failed', { message: error.message }));
  }
});

app.post('/api/scan/file', async (req, res) => {
  res.status(501).json({
    scan_id: crypto.randomUUID(),
    verdict: 'PENDING',
    message: 'File scanning endpoint is not implemented yet',
    note: 'Train and integrate a file model (EMBER recommended) before enabling this route'
  });
});

app.post('/api/scan/bulk', async (req, res) => {
  if (!req.is('application/json')) {
    return res.status(415).json(buildApiError(req, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json'));
  }

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
        const rawResult = await runUrlScan(normalizedUrl);
        const unified = buildUnifiedScanResult(rawResult);

        results.push({
          scan_id: unified.scan_id,
          scanId: unified.scanId,
          url: normalizedUrl,
          verdict: unified.verdict,
          score: unified.score,
          risk_level: unified.riskLevel,
          risk_score: unified.risk_score,
          confidence: unified.confidence
        });
      } catch (error) {
        results.push({
          url: String(inputUrl || ''),
          error: error.message,
          status: 'failed'
        });
      }
    }

    const blockedCount = results.filter((result) => result.verdict === 'BLOCK').length;
    const warnedCount = results.filter((result) => result.verdict === 'WARN').length;
    const failedCount = results.filter((result) => result.status === 'failed').length;
    const confidenceSamples = results
      .filter((result) => typeof result.confidence === 'number')
      .map((result) => result.confidence);

    const avgConfidence = confidenceSamples.length
      ? Number((confidenceSamples.reduce((sum, value) => sum + value, 0) / confidenceSamples.length).toFixed(4))
      : 0;

    return res.json({
      total_scanned: urls.length,
      malicious_count: blockedCount,
      suspicious_count: warnedCount,
      safe_count: urls.length - blockedCount - warnedCount - failedCount,
      failed_count: failedCount,
      avg_confidence: avgConfidence,
      results
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/scans', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json(buildApiError(req, 'DB_UNAVAILABLE', 'Database is unavailable'));
  }

  try {
    const limit = parsePositiveInt(req.query.limit, 50, 1, 200);
    const offset = parsePositiveInt(req.query.offset, 0, 0, 100000);

    const result = await pool.query(
      'SELECT id, url, verdict, confidence, model_used, analysis_time_ms, created_at, features FROM scans ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return res.json({
      total: result.rows.length,
      limit,
      offset,
      scans: result.rows.map((row) => {
        const riskScore = Number(
          typeof row.features?.risk_score === 'number'
            ? row.features.risk_score
            : deriveRiskScoreFromVerdict(row.verdict)
        );

        return {
          ...row,
          scanId: row.id,
          score: toSafetyScore(riskScore),
          risk_score: riskScore
        };
      })
    });
  } catch (error) {
    return res.status(500).json(buildApiError(req, 'SCANS_READ_FAILED', 'Failed to fetch scans', { message: error.message }));
  }
});

app.get('/api/scans/:scanId', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json(buildApiError(req, 'DB_UNAVAILABLE', 'Database is unavailable'));
  }

  try {
    const { scanId } = req.params;

    const result = await pool.query('SELECT * FROM scans WHERE id = $1', [scanId]);

    if (result.rows.length === 0) {
      return res.status(404).json(buildApiError(req, 'SCAN_NOT_FOUND', 'Scan not found'));
    }

    const row = result.rows[0];
    return res.json(buildUnifiedScanResult(buildRawResultFromDbRow(row)));
  } catch (error) {
    return res.status(500).json(buildApiError(req, 'SCAN_READ_FAILED', 'Failed to fetch scan', { message: error.message }));
  }
});

// Extension polling compatibility route.
app.get('/api/scan/result/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;

    if (!dbReady) {
      return res.status(503).json(buildApiError(req, 'DB_UNAVAILABLE', 'Database is unavailable'));
    }

    const result = await pool.query('SELECT * FROM scans WHERE id = $1', [scanId]);
    if (result.rows.length === 0) {
      return res.status(404).json(buildApiError(req, 'SCAN_NOT_FOUND', 'Scan not found'));
    }

    const row = result.rows[0];
    return res.json(buildUnifiedScanResult(buildRawResultFromDbRow(row)));
  } catch (error) {
    return res.status(500).json(buildApiError(req, 'SCAN_RESULT_FAILED', 'Failed to fetch scan result', { message: error.message }));
  }
});

app.get('/api/model/info', async (req, res) => {
  try {
    const info = await getMLService().getModelInfo();
    const performance = await pool.query(
      'SELECT * FROM model_performance ORDER BY timestamp DESC LIMIT 5'
    );

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
});

app.post('/api/debug/features', async (req, res) => {
  let normalizedUrl;
  try {
    normalizedUrl = validateAndNormalizeUrl(req.body?.url);
  } catch (error) {
    return res.status(400).json(buildApiError(req, 'INVALID_URL', error.message));
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
});

app.use((error, req, res, next) => {
  if (error && error.message === 'Not allowed by CORS') {
    return res.status(403).json(buildApiError(req, 'CORS_DENIED', 'CORS: origin not allowed'));
  }

  return next(error);
});

app.use((error, req, res, next) => {
  console.error('Unhandled API error:', error.message);
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    ...buildApiError(req, 'INTERNAL_ERROR', 'Internal server error'),
    request_id: req.requestId
  });
});

async function bootstrap() {
  heuristicsManager.load();
  await initDatabase();

  const mlInitialized = await getMLService().initialize();
  if (mlInitialized) {
    console.log('AI engine ready for inference');
  } else {
    console.log('AI engine running in fallback mode');
  }
}
>>>>>>> 0d59a40 (Restructured the user base)

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize application
    await bootstrap();

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`🚀 SecureSight AI Backend Started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        apiKeyEnabled: !!process.env.API_KEY,
        timestamp: new Date().toISOString()
      });
    });

    return server;
  } catch (error) {
    logger.error('Server startup failed', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`, { signal });
  try {
    // Stop file watcher
    await stopWatcher();
    logger.info('✅ File watcher stopped');
    
    // Close database
    await closeDatabase();
    logger.info('✅ Database closed');
    process.exit(0);
  } catch (error) {
    logger.error('Shutdown error', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server if this is the main module
if (require.main === module) {
  startServer();
}

// Export for testing
module.exports = {
  app,
  startServer,
<<<<<<< HEAD
  shutdown
};
=======
  closeResources,
  combineScores,
  determineVerdict,
  validateAndNormalizeUrl,
  generateRecommendations,
  buildUnifiedScanResult,
  mapRiskLevel,
  toSafetyScore
};
>>>>>>> 0d59a40 (Restructured the user base)
