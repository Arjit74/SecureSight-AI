/**
 * Scan Service
 * Business logic for URL scanning
 */

const crypto = require('crypto');
const URLFeatureExtractor = require('../lib/featureExtractor');
const heuristicsManager = require('../lib/heuristicsManager');
const { getMLService } = require('./mlService');
const { pool } = require('../config/db');
const { cacheGet, cacheSet } = require('./cacheService');

/**
 * Combine ML and heuristic scores
 */
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

/**
 * Determine verdict based on risk score and confidence
 */
function determineVerdict(riskScore, confidence) {
  if (riskScore >= 75 && confidence >= 0.75) return 'BLOCK';
  if (riskScore >= 45 && confidence >= 0.55) return 'WARN';
  if (riskScore <= 25 && confidence <= 0.6) return 'ALLOW';
  return 'WARN';
}

/**
 * Generate security recommendations
 */
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

/**
 * Scan URL and return verdict
 */
async function scanUrl(normalizedUrl) {
  const startTime = Date.now();

  // Check cache first
  const cacheKey = `url:${normalizedUrl}`;
  const cached = cacheGet(cacheKey);

  if (cached) {
    return {
      ...cached.data,
      cached: true,
      cache_age_ms: Date.now() - cached.timestamp
    };
  }

  try {
    // Extract features
    const featureStart = Date.now();
    const features = URLFeatureExtractor.extractFeatures(normalizedUrl);
    const featureTime = Date.now() - featureStart;

    // ML prediction
    const mlStart = Date.now();
    const mlResult = await getMLService().predictUrl(features);
    const mlTime = Date.now() - mlStart;

    // Heuristic evaluation
    const heuristicResult = heuristicsManager.evaluate(normalizedUrl, {});

    // Combine scores and determine verdict
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

    // Cache result
    cacheSet(cacheKey, result);

    // Store in database
    await storeScanInDatabase(result);

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Store scan result in database
 */
async function storeScanInDatabase(scanData) {
  try {
    await pool.query(
      `INSERT INTO scans (id, url, file_name, verdict, confidence, risk_score, malware_type, features, model_used, analysis_time_ms, scan_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        scanData.scan_id,
        scanData.url,
        scanData.file_name || null,
        scanData.verdict,
        scanData.confidence,
        scanData.risk_score || 0,
        scanData.malware_type || null,
        JSON.stringify(scanData.detailed_analysis),
        scanData.model_used,
        scanData.analysis_time_ms,
        new Date()
      ]
    );
  } catch (error) {
    console.error('Failed to store scan in database:', error.message);
  }
}

module.exports = {
  scanUrl,
  combineScores,
  determineVerdict,
  generateRecommendations,
  storeScanInDatabase
};
