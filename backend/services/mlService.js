/**
 * ML Service
 * Handles machine learning model loading and predictions
 */

const path = require('path');

let mlServiceInstance = null;

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
    path.resolve(__dirname, '../../node-ml-bridge/ml_service.js'),
    path.resolve(__dirname, '../..', 'node-ml-bridge', 'ml_service.js')
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

module.exports = {
  getMLService
};
