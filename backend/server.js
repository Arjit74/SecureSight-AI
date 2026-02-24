// server.js - UPDATED WITH AI ENDPOINTS
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

// Import ML and feature extraction modules
const URLFeatureExtractor = require('./lib/featureExtractor');
const MLService = require('./node-ml-bridge/ml_service');
const heuristicsManager = require('./lib/heuristicsManager');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== DATABASE SETUP ==========
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/securesight'
});

// Initialize database tables
const initDatabase = async () => {
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
    
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
};

initDatabase();

// ========== MIDDLEWARE ==========
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'chrome-extension://*',
      'moz-extension://*'
    ];

    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed.replace('*', '')))) {
      callback(null, true);
    } else {
      console.log('❌ CORS rejected for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);

// ========== SCAN RESULTS CACHE ==========
const scanCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ========== HEALTH CHECK ==========
app.get('/api/health', async (req, res) => {
  try {
    const mlInfo = await MLService.getModelInfo();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      ml: mlInfo,
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== AI SCAN ENDPOINTS ==========

// Scan URL with AI
app.post('/api/scan/url', async (req, res) => {
  const startTime = Date.now();
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  console.log(`🔍 AI Scanning URL: ${url}`);
  
  // Check cache
  const cacheKey = `url:${url}`;
  const cached = scanCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`⚡ Cache hit for URL: ${url}`);
    return res.json({
      ...cached.data,
      cached: true,
      cache_age_ms: Date.now() - cached.timestamp
    });
  }
  
  try {
    // Step 1: Extract features
    const featureStart = Date.now();
    const features = URLFeatureExtractor.extractFeatures(url);
    const featureTime = Date.now() - featureStart;
    
    console.log(`📊 Extracted ${Object.keys(features).length} features in ${featureTime}ms`);
    
    // Step 2: ML Prediction
    const mlStart = Date.now();
    const mlResult = await MLService.predictUrl(features);
    const mlTime = Date.now() - mlStart;
    
    // Step 3: Heuristics analysis
    const heuristicResult = heuristicsManager.evaluate(url, features);
    
    // Step 4: Combine results
    const combinedScore = this.combineScores(mlResult, heuristicResult);
    
    // Step 5: Determine verdict
    const verdict = this.determineVerdict(combinedScore, mlResult.confidence);
    
    // Prepare response
    const result = {
      scan_id: crypto.randomUUID(),
      url: url,
      verdict: verdict,
      confidence: mlResult.confidence,
      risk_score: combinedScore,
      model_used: mlResult.model_used,
      analysis_time_ms: Date.now() - startTime,
      features_analyzed: Object.keys(features).length,
      detailed_analysis: {
        ml_prediction: {
          is_malicious: mlResult.is_malicious,
          confidence: mlResult.confidence,
          top_features: mlResult.top_features,
          probabilities: mlResult.probabilities
        },
        heuristics: heuristicResult,
        feature_extraction_time: featureTime,
        ml_inference_time: mlTime
      },
      recommendations: this.generateRecommendations(verdict, mlResult, heuristicResult)
    };
    
    // Cache result
    scanCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    // Store in database
    await this.storeScanInDatabase(result);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ URL scan error:', error);
    res.status(500).json({
      error: 'Scan failed',
      message: error.message,
      fallback_verdict: 'WARN',
      confidence: 0.5
    });
  }
});

// Scan file with AI
app.post('/api/scan/file', async (req, res) => {
  try {
    // For now, return not implemented with mock data
    // In production, you would:
    // 1. Extract file features
    // 2. Use file ML model
    // 3. Return prediction
    
    res.json({
      scan_id: crypto.randomUUID(),
      verdict: 'PENDING',
      message: 'File scanning coming soon',
      note: 'Train file model using EMBER dataset for production'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk URL scan
app.post('/api/scan/bulk', async (req, res) => {
  const { urls } = req.body;
  
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'URLs array is required' });
  }
  
  if (urls.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 URLs per request' });
  }
  
  console.log(`🔍 Bulk scanning ${urls.length} URLs`);
  
  try {
    const results = [];
    
    for (const url of urls) {
      try {
        const features = URLFeatureExtractor.extractFeatures(url);
        const mlResult = await MLService.predictUrl(features);
        
        results.push({
          url: url,
          is_malicious: mlResult.is_malicious,
          confidence: mlResult.confidence,
          risk_level: mlResult.is_malicious ? 'HIGH' : 'LOW'
        });
      } catch (error) {
        results.push({
          url: url,
          error: error.message,
          status: 'failed'
        });
      }
    }
    
    // Statistics
    const maliciousCount = results.filter(r => r.is_malicious).length;
    const avgConfidence = results
      .filter(r => r.confidence)
      .reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    res.json({
      total_scanned: urls.length,
      malicious_count: maliciousCount,
      safe_count: urls.length - maliciousCount,
      avg_confidence: avgConfidence,
      results: results
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scan history
app.get('/api/scans', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await pool.query(
      'SELECT id, url, verdict, confidence, model_used, analysis_time_ms, created_at FROM scans ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    res.json({
      total: result.rows.length,
      scans: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific scan
app.get('/api/scans/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM scans WHERE id = $1',
      [scanId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Model information
app.get('/api/model/info', async (req, res) => {
  try {
    const info = await MLService.getModelInfo();
    
    // Add performance metrics from database
    const performance = await pool.query(
      'SELECT * FROM model_performance ORDER BY timestamp DESC LIMIT 5'
    );
    
    res.json({
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
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for feature extraction
app.post('/api/debug/features', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const features = URLFeatureExtractor.extractFeatures(url);
    
    res.json({
      url: url,
      feature_count: Object.keys(features).length,
      features: features,
      sample_features: {
        url_length: features.url_length,
        digit_ratio: features.digit_ratio,
        entropy: features.url_entropy,
        suspicious_tld: features.is_suspicious_tld,
        has_ip: features.has_ip_address
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== HELPER FUNCTIONS ==========

function combineScores(mlResult, heuristicResult) {
  // Weighted combination of ML and heuristic scores
  const mlWeight = 0.7;
  const heuristicWeight = 0.3;
  
  const mlScore = mlResult.is_malicious ? 
    (mlResult.confidence * 100) : 
    ((1 - mlResult.confidence) * 100);
  
  const heuristicScore = heuristicResult.score || 50;
  
  return (mlScore * mlWeight) + (heuristicScore * heuristicWeight);
}

function determineVerdict(riskScore, confidence) {
  if (riskScore >= 70 && confidence > 0.8) return 'BLOCK';
  if (riskScore >= 40 && confidence > 0.6) return 'WARN';
  if (riskScore < 20 || confidence < 0.4) return 'ALLOW';
  return 'WARN'; // Default to warn if uncertain
}

function generateRecommendations(verdict, mlResult, heuristicResult) {
  const recommendations = [];
  
  if (verdict === 'BLOCK') {
    recommendations.push('Do not visit this URL');
    recommendations.push('Report as phishing if appropriate');
    
    if (mlResult.top_features && Object.keys(mlResult.top_features).length > 0) {
      const topFeature = Object.keys(mlResult.top_features)[0];
      recommendations.push(`Top risk factor: ${topFeature}`);
    }
  } else if (verdict === 'WARN') {
    recommendations.push('Exercise caution when visiting');
    recommendations.push('Verify the website authenticity');
    recommendations.push('Check for HTTPS encryption');
  } else {
    recommendations.push('URL appears safe');
    recommendations.push('Standard browsing precautions apply');
  }
  
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
    console.error('Failed to store scan in database:', error);
  }
}

// ========== START SERVER ==========
app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🔐 SecureSight AI - Server-Based Malware Detection        ║
║                                                              ║
║   Server running on: http://localhost:${PORT}                  ║
║                                                              ║
║   Endpoints:                                                 ║
║   - POST /api/scan/url        - Scan URL with AI            ║
║   - POST /api/scan/file       - Scan file (coming soon)     ║
║   - POST /api/scan/bulk       - Bulk URL scan               ║
║   - GET  /api/scans           - Scan history                ║
║   - GET  /api/model/info      - Model information           ║
║   - GET  /api/health          - Health check                ║
║   - POST /api/debug/features  - Debug feature extraction    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  // Initialize ML service
  console.log('🤖 Initializing AI engine...');
  const mlInitialized = await MLService.initialize();
  
  if (mlInitialized) {
    console.log('✅ AI engine ready for inference');
    console.log('📊 Feature extractor: 65+ URL features');
    console.log('🧠 ML Model: Random Forest classifier');
  } else {
    console.log('⚠️ AI engine in fallback mode (using heuristics)');
  }
  
  console.log(`📁 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Local'}`);
  console.log('\n🚀 Ready to accept scan requests!');
});