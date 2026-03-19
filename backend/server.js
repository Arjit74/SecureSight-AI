const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const cors = require('cors');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const URLFeatureExtractor = require('./lib/featureExtractor');
const heuristicsManager = require('./lib/heuristicsManager');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
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

async function storeScanInDatabase(scanData) {
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
  const startTime = Date.now();

  let normalizedUrl;
  try {
    normalizedUrl = validateAndNormalizeUrl(req.body?.url);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const cacheKey = `url:${normalizedUrl}`;
  const cached = cacheGet(cacheKey);

  if (cached) {
    return res.json({
      ...cached.data,
      cached: true,
      cache_age_ms: Date.now() - cached.timestamp
    });
  }

  try {
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

    const result = {
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

    cacheSet(cacheKey, result);
    await storeScanInDatabase(result);

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
        const features = URLFeatureExtractor.extractFeatures(normalizedUrl);
        const mlResult = await getMLService().predictUrl(features);

        results.push({
          url: normalizedUrl,
          is_malicious: Boolean(mlResult.is_malicious),
          confidence: typeof mlResult.confidence === 'number' ? mlResult.confidence : 0,
          risk_level: mlResult.is_malicious ? 'HIGH' : 'LOW'
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
});

app.get('/api/scans', async (req, res) => {
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

app.get('/api/scans/:scanId', async (req, res) => {
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
});

app.use((error, req, res, next) => {
  if (error && error.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: origin not allowed' });
  }

  return next(error);
});

app.use((error, req, res, next) => {
  console.error('Unhandled API error:', error.message);
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error: 'Internal server error',
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

async function startServer() {
  await bootstrap();

  return app.listen(PORT, () => {
    console.log(`SecureSight AI backend running on http://localhost:${PORT}`);
    console.log(`Database status: ${dbReady ? 'Connected' : 'Unavailable'}`);
    console.log(`API key enforcement: ${API_KEY ? 'Enabled' : 'Disabled (set API_KEY to enable)'}`);
  });
}

async function closeResources() {
  await pool.end();
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
  closeResources,
  combineScores,
  determineVerdict,
  validateAndNormalizeUrl,
  generateRecommendations
};